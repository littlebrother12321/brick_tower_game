import { createNoise2D } from 'simplex-noise';
import "./depends/p5.min.js.js";
import "./depends/planck.min.js.js";
import "./depends/p5play.js.js";


// initialize the noise function
const noise2D = createNoise2D();
// returns a value between -1 and 1
console.log(noise2D(0, 1000));

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    HELLO
  </div>
`
