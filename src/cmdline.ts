import * as Data from './data.js';
import * as Stamp from './stamp.js';
import * as Measure from './measure.js';
import Image from './image.js';

import { JSDOM } from 'jsdom';
import fs from 'node:fs';

const imgpad = 1;
const gridpad = 0;

const dom = new JSDOM('<svg id="grid"></svg>');
const svg = dom.window.document.getElementById('grid') as unknown as SVGElement;
const image = new Image(dom.window.document, svg);
Data.initialize(image);

const stamp = Stamp.render(Data.deserialize(new Uint8Array(atob(process.argv[2]).split('').map(c => c.charCodeAt(0)))));
stamp.apply(0, 0);

const xmin = Math.floor(stamp.xmin/2)*2;
const ymin = Math.floor(stamp.ymin/2)*2;
const xmax = Math.ceil(stamp.xmax/2)*2;
const ymax = Math.ceil(stamp.ymax/2)*2;
image.grid(xmin-gridpad, xmax+gridpad, ymin-gridpad, ymax+gridpad);

image.text.setAttribute('transform', 'translate(0 2.5)');
svg.setAttribute('viewBox', `${Measure.HALFCELL*(xmin-imgpad)} ${Measure.HALFCELL*(ymin-imgpad)} ${Measure.HALFCELL*(xmax-xmin+2*imgpad)} ${Measure.HALFCELL*(ymax-ymin+2*imgpad)}`);

fs.writeFileSync('out.svg', svg.outerHTML);
