import {nodes, position} from "./_nodes.js";
import {HandcraftNode} from "../dom.js";

export function prepend(...children) {
	return nodes.call(this, position.start, ...children);
}

HandcraftNode.prototype.prepend = prepend;
