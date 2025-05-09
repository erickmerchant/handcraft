import {nodes, position, HandcraftNode} from "../dom.js";

export function prepend(...children) {
	nodes.call(this, position.start, ...children);
}

HandcraftNode.prototype.prepend = prepend;
