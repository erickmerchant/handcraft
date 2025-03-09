import {nodes, position} from "./_nodes.js";
import {HandcraftNode} from "../dom.js";

export function append(...children) {
	return nodes.call(this, position.end, ...children);
}

HandcraftNode.prototype.append = append;
