const fs = require("fs");
let c = fs.readFileSync("src/components/dashboard/views/admin/AdminDashboard.jsx","utf8");
// Remove the ! and any trailing chars after name on greeting line
c = c.replace("Good {greet}, {user?.name?.split(\" \")[0] || \"Admin\"}!", "Good {greet}, {user?.name?.split(\" \")[0] || \"Admin\"}");
fs.writeFileSync("src/components/dashboard/views/admin/AdminDashboard.jsx", c, "utf8");
console.log("done");
