import {nodes, position, HandcraftNode} from "../dom.js";

export function append(...children) {
	return nodes.call(this, position.end, ...children);
}

HandcraftNode.prototype.append = append;
