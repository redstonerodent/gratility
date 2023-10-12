import Tool from 'tool';
import * as Data from 'data';
import * as Measure from 'measure';

export default class LineTool implements Tool {

    public readonly name = 'Line';

    private isDrawing: boolean | undefined = undefined;
    private x = 0;
    private y = 0;

    public ondown(x: number, y: number) {
        this.x = Measure.cell(x);
        this.y = Measure.cell(y);
    }

    public onmove(x: number, y: number) {
        x = Measure.cell(x);
        y = Measure.cell(y);
        if (x === this.x && y === this.y) return;

        const dx = Math.abs(this.x - x);
        const dy = Math.abs(this.y - y);
        const lx = Math.min(x, this.x);
        const ly = Math.min(y, this.y);
        this.x = x;
        this.y = y;
        if (!(dx === 0 && dy === 1 || dx === 1 && dy === 0)) return;

        const n = dx > 0 ? Data.encode(lx*2+2, ly*2+1) : Data.encode(lx*2+1, ly*2+2);
        const line = Data.lines.get(n);

        if (this.isDrawing === undefined) {
            this.isDrawing = line === undefined;
        }

        if (line === undefined) {
            if (this.isDrawing) {
                Data.lines.set(n, new Data.Line(0, n));
            }
        } else {
            if (!this.isDrawing) {
                line.destroy();
                Data.lines.delete(n);
            }
        }
    }

    public onup() { this.isDrawing = undefined; }

}