import {
	html,
	svg,
	$,
	watch,
	effect,
	define,
	each,
} from "handcraft/prelude/all.js";

let {input, label, h1, li, button, ol} = html;
let {title, path} = svg;

define("to-do-app").connected((host) => {
	let state = watch(
		JSON.parse(localStorage.getItem("to-do-app")) ?? {
			showDone: true,
			list: [],
		}
	);
	let dragState = watch({
		item: null,
	});

	state.list = watch(state.list.map((item) => watch(item)));

	effect(() => {
		localStorage.setItem("to-do-app", JSON.stringify(state));
	});

	host.on(["dragover", "dragleave", "drop"], function (e) {
		if (dragState.item != null) {
			e.preventDefault();
		}
	});

	let heading = h1().classes("title").text("To Do List");
	let showDoneCheckbox = input()
		.classes("show-done")
		.attr("id", "show-done")
		.attr("type", "checkbox")
		.prop("checked", () => state.showDone)
		.on("change", function () {
			let show = this.checked;

			for (let item of state.list) {
				if (item.isDone) {
					item.isEntering = show;
					item.isLeaving = !show;
				}
			}

			state.showDone = show;
		});
	let showDoneLabel = label().attr("for", "show-done").text("Show done");
	let textInput = input()
		.classes("input-text")
		.attr("placeholder", "What do you have to do?")
		.on("keypress", function (e) {
			if (e.keyCode === 13) {
				e.preventDefault();

				let text = this.value.trim();

				if (!text) {
					return;
				}

				state.list.push(
					watch({
						text,
						isDone: false,
						isEntering: true,
						isLeaving: false,
					})
				);

				this.value = "";
			}
		});
	let itemsList = each(state.list)
		.filter(
			(entry) => state.showDone || !entry.value.isDone || entry.value.isLeaving
		)
		.map((entry) => {
			let toggleDoneCheckbox = input()
				.attr("type", "checkbox")
				.attr("id", () => `item-${entry.index}`)
				.prop("checked", () => entry.value.isDone)
				.on("change", function () {
					let isDone = this.checked;

					if (!state.showDone && isDone) {
						entry.value.isLeaving = true;
					}

					entry.value.isDone = isDone;
				});
			let itemLabel = label()
				.attr("for", () => `item-${entry.index}`)
				.text(() => entry.value.text);
			let deleteButton = button()
				.attr("type", "button")
				.classes("delete")
				.on("click", function () {
					entry.value.isLeaving = true;
					entry.value.isDeleted = true;
				})
				.nodes(
					svg()
						.attr("viewBox", "0 0 16 16")
						.nodes(
							title().text("Delete"),
							path().attr(
								"d",
								"M4 1 L8 5 L12 1 L15 4 L11 8 L15 12 L12 15 L8 11 L4 15 L1 12 L5 8 L1 4 Z"
							)
						)
				);

			return li()
				.classes("item", {
					done: () => entry.value.isDone,
					leaving: () => entry.value.isLeaving,
					entering: () => entry.value.isEntering,
					dragging: () => dragState.item === entry.value,
				})
				.prop("draggable", true)
				.on("dragstart", function (e) {
					dragState.item = entry.value;

					e.dataTransfer.effectAllowed = "move";
					// e.dataTransfer.setDragImage(this, e.offsetX, e.offsetY);
				})
				.on("dragend", function () {
					dragState.item = null;
				})
				.on("dragenter", function () {
					if (dragState.item != null) {
						let from = state.list.findIndex((t) => t === dragState.item);

						state.list.splice(from, 1);
						state.list.splice(entry.index, 0, dragState.item);
					}
				})
				.on(["dragover", "dragleave", "drop"], function (e) {
					e.preventDefault();
				})
				.on("animationend", function () {
					entry.value.isLeaving = false;
					entry.value.isEntering = false;

					if (entry.value.isDeleted) {
						state.list.splice(
							state.list.findIndex((item) => item === entry.value),
							1
						);
					}
				})
				.nodes(toggleDoneCheckbox, itemLabel, deleteButton);
		});

	let listOl = ol().classes("list").nodes(itemsList);

	host.nodes(heading, showDoneCheckbox, showDoneLabel, textInput, listOl);

	$(document.body).on(["dragover", "dragleave", "drop"], function (e) {
		e.preventDefault();
	});
});
