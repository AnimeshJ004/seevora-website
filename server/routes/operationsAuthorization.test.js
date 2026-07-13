import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import appointmentsRouter, {
  appointmentAdminGuard,
  appointmentManagerGuard,
} from './appointments.js';
import reviewsRouter, { reviewAdminGuard } from './reviews.js';

const ACCESS_DENIED = 'Access denied. Insufficient permissions.';

function makeResponse() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

function authorize(guard, role) {
  const response = makeResponse();
  let nextCalled = false;

  guard[1]({ user: role ? { role } : null }, response, () => {
    nextCalled = true;
  });

  return { response, nextCalled };
}

async function authenticateWithoutToken(guard) {
  const response = makeResponse();
  let nextCalled = false;

  await guard[0]({ get: () => '' }, response, () => {
    nextCalled = true;
  });

  return { response, nextCalled };
}

function findRoute(router, method, path) {
  return router.stack.find(
    (layer) => layer.route?.path === path && layer.route.methods[method]
  )?.route;
}

function assertRouteUsesGuard(router, method, path, guard) {
  const route = findRoute(router, method, path);
  assert.ok(route, `${method.toUpperCase()} ${path} route is missing`);
  assert.ok(route.stack.some((layer) => layer.handle === guard[0]), 'authentication guard is missing');
  assert.ok(route.stack.some((layer) => layer.handle === guard[1]), 'authorization guard is missing');
}

describe('appointment authorization', () => {
  it('requires authentication for appointment access', async () => {
    const { response, nextCalled } = await authenticateWithoutToken(appointmentManagerGuard);

    assert.equal(nextCalled, false);
    assert.equal(response.statusCode, 401);
    assert.equal(response.body.message, 'Authentication is required.');
  });

  it('allows admin and manager to read, create, and update appointments', () => {
    for (const role of ['admin', 'super_admin', 'manager']) {
      const { response, nextCalled } = authorize(appointmentManagerGuard, role);
      assert.equal(nextCalled, true, `${role} should be allowed`);
      assert.equal(response.statusCode, 200);
    }
  });

  it('denies other roles from reading, creating, or updating appointments', () => {
    for (const role of ['employee', 'hr', 'support']) {
      const { response, nextCalled } = authorize(appointmentManagerGuard, role);
      assert.equal(nextCalled, false, `${role} should be denied`);
      assert.equal(response.statusCode, 403);
      assert.equal(response.body.message, ACCESS_DENIED);
    }
  });

  it('allows only admin to delete appointments', () => {
    for (const role of ['admin', 'super_admin']) {
      assert.equal(authorize(appointmentAdminGuard, role).nextCalled, true);
    }

    for (const role of ['manager', 'employee', 'hr', 'support']) {
      const { response, nextCalled } = authorize(appointmentAdminGuard, role);
      assert.equal(nextCalled, false, `${role} should be denied`);
      assert.equal(response.statusCode, 403);
      assert.equal(response.body.message, ACCESS_DENIED);
    }
  });

  it('wires the correct guard to every appointment method', () => {
    assertRouteUsesGuard(appointmentsRouter, 'get', '/', appointmentManagerGuard);
    assertRouteUsesGuard(appointmentsRouter, 'post', '/', appointmentManagerGuard);
    assertRouteUsesGuard(appointmentsRouter, 'put', '/:id', appointmentManagerGuard);
    assertRouteUsesGuard(appointmentsRouter, 'delete', '/:id', appointmentAdminGuard);
  });
});

describe('review authorization', () => {
  it('requires authentication for review access', async () => {
    const { response, nextCalled } = await authenticateWithoutToken(reviewAdminGuard);

    assert.equal(nextCalled, false);
    assert.equal(response.statusCode, 401);
    assert.equal(response.body.message, 'Authentication is required.');
  });

  it('allows admin and normalized super_admin access', () => {
    for (const role of ['admin', 'super_admin']) {
      const { response, nextCalled } = authorize(reviewAdminGuard, role);
      assert.equal(nextCalled, true, `${role} should be allowed`);
      assert.equal(response.statusCode, 200);
    }
  });

  it('denies every non-admin role', () => {
    for (const role of ['manager', 'employee', 'hr', 'support']) {
      const { response, nextCalled } = authorize(reviewAdminGuard, role);
      assert.equal(nextCalled, false, `${role} should be denied`);
      assert.equal(response.statusCode, 403);
      assert.equal(response.body.message, ACCESS_DENIED);
    }
  });

  it('applies the admin guard before every review route', () => {
    const firstRouteIndex = reviewsRouter.stack.findIndex((layer) => layer.route);
    const authenticationIndex = reviewsRouter.stack.findIndex(
      (layer) => layer.handle === reviewAdminGuard[0]
    );
    const authorizationIndex = reviewsRouter.stack.findIndex(
      (layer) => layer.handle === reviewAdminGuard[1]
    );

    assert.ok(firstRouteIndex >= 0, 'review routes are missing');
    assert.ok(authenticationIndex >= 0 && authenticationIndex < firstRouteIndex);
    assert.ok(authorizationIndex >= 0 && authorizationIndex < firstRouteIndex);
  });
});
