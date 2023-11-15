import Tool from 'tool';
import * as Data from 'data';

export default class RedoTool implements Tool {

    public readonly name = 'Redo';
    public readonly repeat = true;
    public ondown() { Data.undo(true); }
    public onmove() {}
    public onup() {}

}
