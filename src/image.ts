import * as Measure from './measure.js';
import * as Data from './data.js';
import * as Color from './color.js';

const svgNS = 'http://www.w3.org/2000/svg';

const drawfns: { [obj in Data.Obj]: (image: Image, x: number, y: number, data: never) => SVGElement } = {

    [Data.Obj.SURFACE]: (image: Image, x: number, y: number, data: number) => {
        return image.draw(undefined, 'rect', {
            width: Measure.CELL,
            height: Measure.CELL,
            x: Measure.HALFCELL*(x-1),
            y: Measure.HALFCELL*(y-1),
            fill: Color.colors[data]
        });
    },

    [Data.Obj.LINE]: (image: Image, x: number, y: number, data: number) => {
        const horiz = Measure.hctype(x, y) === Measure.HC.EVERT ? 1 : 0;
        return image.draw(undefined, 'line', {
            x1: (x - horiz) * Measure.HALFCELL,
            x2: (x + horiz) * Measure.HALFCELL,
            y1: (y - (1-horiz)) * Measure.HALFCELL,
            y2: (y + (1-horiz)) * Measure.HALFCELL,
            stroke: Color.colors[data],
            strokeWidth: Measure.LINE,
            strokeLinecap: 'round'
        });
    },

    [Data.Obj.EDGE]: (image: Image, x: number, y: number, [spec, reversed]: [Data.EdgeSpec, boolean]) => {
        const g = image.draw(undefined, 'g', {
            transform: `
                translate(${x * Measure.HALFCELL} ${y * Measure.HALFCELL})
                rotate(${((y%2===0) == spec.isEdge ? 0 : 90) + (reversed ? 180 : 0)})
                `
        });
        const stroke = Color.colors[spec.color];
        const strokeLinecap = 'round'
        image.draw(g, 'line', {
            x1: Measure.HALFCELL,
            x2: -Measure.HALFCELL,
            y1: 0,
            y2: 0,
            strokeWidth: Measure.EDGE * spec.thickness,
            stroke, strokeLinecap
        });
        switch (spec.head) {
        case Data.Head.NONE:
            break;
        case Data.Head.ARROW:
            image.draw(g, 'path', {
                d: 'M 3 5 L -2 0 L 3 -5',
                fill: 'none',
                strokeWidth: Measure.EDGE * Math.sqrt(spec.thickness),
                transform: `scale(${Math.sqrt(spec.thickness)})`,
                stroke, strokeLinecap
            });
        }
        return g;

    },

    [Data.Obj.SHAPE]: (image: Image, x: number, y: number, data: Data.ShapeSpec[]) => {
        const g = image.draw(undefined, 'g', {
            transform: `translate(${x * Measure.HALFCELL} ${y * Measure.HALFCELL})`
        });

        for (const spec of data) {
            const r = Measure.HALFCELL * (spec.size/6);
            const strokeWidth = Measure.HALFCELL * (0.05 + 0.1*(spec.size/12));
            const fill = spec.fill === undefined ? 'transparent' : Color.colors[spec.fill];
            const stroke = spec.outline === undefined ? 'transparent' : Color.colors[spec.outline];

            switch (spec.shape) {
            case Data.Shape.CIRCLE:
                image.draw(g, 'circle', {
                    cx: 0, cy: 0, r: r,
                    strokeWidth, fill, stroke
                });
                break;
            case Data.Shape.SQUARE:
                image.draw(g, 'rect', {
                    width: r*2, height: r*2, x: -r, y: -r,
                    strokeWidth, fill, stroke
                });
                break;
            case Data.Shape.FLAG:
                image.draw(g, 'path', {
                    d: 'M -0.8 1 L -0.8 -1 L -0.6 -1 L 0.8 -0.5 L -0.6 0 L -0.6 1 Z',
                    transform: `scale(${r*0.9})`,
                    strokeWidth: strokeWidth/(r*0.9), fill, stroke
                });
                break;
            case Data.Shape.STAR:
                image.draw(g, 'path', {
                    d: 'M' + [0,1,2,3,4,5,6,7,8,9].map(n => (
                        r*(n%2===0?1:0.5)*Math.cos((n/5+0.5)*Math.PI) + ' ' +
                            -r*(n%2===0?1:0.5)*Math.sin((n/5+0.5)*Math.PI)
                    )).join('L') + 'Z',
                    strokeWidth, fill, stroke
                });
                break;
            }
        }

        return g;
    },

    [Data.Obj.TEXT]: (image: Image, x: number, y: number, data: string) => {
        return image.draw(undefined, 'text', {
            x: Measure.HALFCELL*x,
            y: Measure.HALFCELL*y,
            textAnchor: 'middle',
            dominantBaseline: 'central',
            fontSize: Measure.CELL*(
                data.length === 1 ? 0.75 :
                data.length === 2 ? 0.55 :
                data.length === 3 ? 0.4 :
                0.3
            ),
            textContent: data
        });
    },

};

export default class Image {

    public readonly root:      SVGElement;
    public readonly gridlines: SVGElement;
    public readonly surface:   SVGElement;
    public readonly line:      SVGElement;
    public readonly edge:      SVGElement;
    public readonly shape:     SVGElement;
    public readonly textInd:   SVGElement;
    public readonly text:      SVGElement;
    public readonly copypaste: SVGElement;
    public readonly stamps:    SVGElement;

    constructor(private document: HTMLDocument, svg: SVGElement) {
        this.root      = this.draw(svg, 'g');
        this.gridlines = this.draw(this.root, 'g', { stroke: Measure.GRIDCOLOR, strokeWidth: Measure.GRIDLINE });
        this.surface   = this.draw(this.root, 'g');
        this.line      = this.draw(this.root, 'g');
        this.edge      = this.draw(this.root, 'g');
        this.shape     = this.draw(this.root, 'g');
        this.textInd   = this.draw(this.root, 'g');
        this.text      = this.draw(this.root, 'g');
        this.copypaste = this.draw(this.root, 'g');
        this.stamps    = this.draw(this.root, 'g', { opacity: 0.5 });
    }

    public draw(parent: SVGElement | undefined, tagname: string, attrs: object = {}): SVGElement {
        const elt = this.document.createElementNS(svgNS, tagname);
        for (let [k, v] of Object.entries(attrs)) {
            if (k === 'children') {
                for (let child of v) elt.appendChild(child);
            } else if (k === 'textContent') {
                elt.textContent = v;
            } else {
                elt.setAttribute(k === 'viewBox' ? k : k.replace(/[A-Z]/g, m => '-'+m.toLowerCase()), v);
            }
        }
        if (parent !== undefined) parent.appendChild(elt);
        return elt;
    }

    public obj(obj: Data.Obj): SVGElement {
        switch (obj) {
        case Data.Obj.SURFACE: return this.surface;
        case Data.Obj.LINE:    return this.line;
        case Data.Obj.EDGE:    return this.edge;
        case Data.Obj.SHAPE:   return this.shape;
        case Data.Obj.TEXT:    return this.text;
        }
    }

    public objdraw(obj: Data.Obj, x: number, y: number, data: any) {
        return drawfns[obj](this, x, y, data as never);
    }

    public grid(xmin: number, xmax: number, ymin: number, ymax: number) {
        for (let x = Math.ceil(xmin/2)*2; x <= xmax; x += 2) {
            this.draw(this.gridlines, 'line', {
                x1: x * Measure.HALFCELL, x2: x * Measure.HALFCELL,
                y1: ymin * Measure.HALFCELL, y2: ymax * Measure.HALFCELL
            });
        }
        for (let y = Math.ceil(ymin/2)*2; y <= ymax; y += 2) {
            this.draw(this.gridlines, 'line', {
                x1: xmin * Measure.HALFCELL, x2: xmax * Measure.HALFCELL,
                y1: y * Measure.HALFCELL, y2: y * Measure.HALFCELL
            });
        }
    }
}
