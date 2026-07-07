const fs = require('fs');
let code = fs.readFileSync('src/components/landing-page/HomePage.jsx', 'utf8');

const importsToAdd = 
import img1 from '../../assets/services/img1.jpg';
import img2 from '../../assets/services/img2.jpg';
import img3 from '../../assets/services/img3.jpg';
import img4 from '../../assets/services/img4.jpg';
import img5 from '../../assets/services/img5.jpg';
import imgVoice from '../../assets/services/img-voice.jpg';
import imgHandshake from '../../assets/services/img-handshake.jpg';
import imgAiPlug from '../../assets/services/img-ai-plug.jpg';
import imgOffice from '../../assets/services/img-office.jpg';
;

// Add imports after Chatbot
code = code.replace(/import Chatbot from '\.\/Chatbot';\r?\n?/, "import Chatbot from './Chatbot';\n" + importsToAdd);

// Replace the Unsplash URLs with the local image variables
code = code.replace(/image: 'https:\/\/images\.unsplash\.com\/photo-1542744173-8e7e53415bb0\?auto=format&fit=crop&w=800&q=80',/, "image: img1,");
code = code.replace(/image: 'https:\/\/images\.unsplash\.com\/photo-1551434678-e076c223a692\?auto=format&fit=crop&w=800&q=80',/, "image: img2,");
code = code.replace(/image: 'https:\/\/images\.unsplash\.com\/photo-1504384308090-c894fdcc538d\?auto=format&fit=crop&w=800&q=80',/, "image: img3,");
code = code.replace(/image: 'https:\/\/images\.unsplash\.com\/photo-1512428559087-560fa5ceab42\?auto=format&fit=crop&w=800&q=80',/, "image: img4,");
code = code.replace(/image: 'https:\/\/images\.unsplash\.com\/photo-1460925895917-afdab827c52f\?auto=format&fit=crop&w=800&q=80',/, "image: img5,");
code = code.replace(/image: 'https:\/\/images\.unsplash\.com\/photo-1556761175-5973dc0f32e7\?auto=format&fit=crop&w=800&q=80',/, "image: imgVoice,");
code = code.replace(/image: 'https:\/\/images\.unsplash\.com\/photo-1516321318423-f06f85e504b3\?auto=format&fit=crop&w=800&q=80',/, "image: imgHandshake,");
code = code.replace(/image: 'https:\/\/images\.unsplash\.com\/photo-1498050108023-c5249f4df085\?auto=format&fit=crop&w=800&q=80',/, "image: imgAiPlug,");
code = code.replace(/image: 'https:\/\/images\.unsplash\.com\/photo-1554224155-8d04cb21cd6c\?auto=format&fit=crop&w=800&q=80',/, "image: imgOffice,");

fs.writeFileSync('src/components/landing-page/HomePage.jsx', code);
console.log('Restored local images!');
