import {nodes, position, HandcraftNode} from "../dom.js";

export function append(...children) {
	nodes.call(this, position.end, ...children);
}

HandcraftNode.prototype.append = append;
