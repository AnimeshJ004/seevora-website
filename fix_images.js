const fs = require('fs');
let code = fs.readFileSync('src/components/landing-page/HomePage.jsx', 'utf8');

const importsToRemove = [
  /import img1 from '\.\.\/\.\.\/assets\/services\/img1\.jpg';\r?\n?/,
  /import img2 from '\.\.\/\.\.\/assets\/services\/img2\.jpg';\r?\n?/,
  /import img3 from '\.\.\/\.\.\/assets\/services\/img3\.jpg';\r?\n?/,
  /import img4 from '\.\.\/\.\.\/assets\/services\/img4\.jpg';\r?\n?/,
  /import img5 from '\.\.\/\.\.\/assets\/services\/img5\.jpg';\r?\n?/,
  /import imgVoice from '\.\.\/\.\.\/assets\/services\/img-voice\.jpg';\r?\n?/,
  /import imgHandshake from '\.\.\/\.\.\/assets\/services\/img-handshake\.jpg';\r?\n?/,
  /import imgAiPlug from '\.\.\/\.\.\/assets\/services\/img-ai-plug\.jpg';\r?\n?/,
  /import imgOffice from '\.\.\/\.\.\/assets\/services\/img-office\.jpg';\r?\n?/
];
importsToRemove.forEach(regex => {
  code = code.replace(regex, '');
});

code = code.replace(/image: img1,/, "image: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=800&q=80',");
code = code.replace(/image: img2,/, "image: 'https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=800&q=80',");
code = code.replace(/image: img3,/, "image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80',");
code = code.replace(/image: img4,/, "image: 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&w=800&q=80',");
code = code.replace(/image: img5,/, "image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',");
code = code.replace(/image: imgVoice,/, "image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=800&q=80',");
code = code.replace(/image: imgHandshake,/, "image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80',");
code = code.replace(/image: imgAiPlug,/, "image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80',");
code = code.replace(/image: imgOffice,/, "image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80',");

fs.writeFileSync('src/components/landing-page/HomePage.jsx', code);
