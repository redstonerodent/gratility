import Tool from 'tools/tool';
import PanTool from 'tools/pan';
import SurfaceTool from 'tools/surface';

export const mouseTools = new Map<number, Tool>();
export const keyTools = new Map<string, Tool>();

mouseTools.set(1, new PanTool());
keyTools.set(' ', new PanTool());
keyTools.set('s', new SurfaceTool());
