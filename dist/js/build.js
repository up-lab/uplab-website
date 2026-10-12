// Hero animation: an agent gets coded, wired to tools, then runs a task.
(function () {
	const root = document.querySelector('[data-build]');
	if (!root) return;

	const TOOLS = ['github', 'linear', 'slack', 'notion', 'postgresql', 'stripe', 'docker', 'sentry'];
	const TOOL_ALIAS = { postgres: 'postgresql' };

	// Code lines are [text, class] tokens. Class "t" marks a tool reference.
	const SCENARIOS = [
		{
			file: 'triage-agent.ts',
			code: [
				[['import', 'k'], [' { Agent } ', ''], ['from', 'k'], [' "./agent"', 's']],
				[],
				[['const', 'k'], [' agent = ', ''], ['new', 'k'], [' Agent', 'f'], ['({', '']],
				[['  model: ', ''], ['"claude"', 's'], [',', '']],
				[['  tools: [', ''], ['github', 't'], [', ', ''], ['linear', 't'], [', ', ''], ['slack', 't'], ['],', '']],
				[['})', '']],
				[],
				[['await', 'k'], [' agent.', ''], ['run', 'f'], ['(', ''], ['"triage issues"', 's'], [')', '']],
			],
			steps: [
				['github', 'Read 12 issues'],
				['linear', 'Created 3 tickets'],
				['slack', 'Posted to #eng'],
			],
			done: 'Triage complete',
		},
		{
			file: 'support-agent.ts',
			code: [
				[['import', 'k'], [' { Agent } ', ''], ['from', 'k'], [' "./agent"', 's']],
				[],
				[['const', 'k'], [' agent = ', ''], ['new', 'k'], [' Agent', 'f'], ['({', '']],
				[['  model: ', ''], ['"claude"', 's'], [',', '']],
				[['  mcp: [', ''], ['notion', 't'], [', ', ''], ['postgres', 't'], [', ', ''], ['stripe', 't'], ['],', '']],
				[['})', '']],
				[],
				[['await', 'k'], [' agent.', ''], ['run', 'f'], ['(', ''], ['"resolve #482"', 's'], [')', '']],
			],
			steps: [
				['notion', 'Searched docs'],
				['postgresql', 'Checked account'],
				['stripe', 'Refunded €29'],
			],
			done: 'Ticket resolved',
		},
		{
			file: 'deploy-agent.ts',
			code: [
				[['import', 'k'], [' { Agent } ', ''], ['from', 'k'], [' "./agent"', 's']],
				[],
				[['const', 'k'], [' agent = ', ''], ['new', 'k'], [' Agent', 'f'], ['({', '']],
				[['  model: ', ''], ['"claude"', 's'], [',', '']],
				[['  tools: [', ''], ['sentry', 't'], [', ', ''], ['github', 't'], [', ', ''], ['docker', 't'], ['],', '']],
				[['})', '']],
				[],
				[['await', 'k'], [' agent.', ''], ['run', 'f'], ['(', ''], ['"fix the deploy"', 's'], [')', '']],
			],
			steps: [
				['sentry', 'Found the error'],
				['github', 'Opened a fix PR'],
				['docker', 'Build deployed'],
			],
			done: 'Deploy fixed',
		},
	];

	const graph = root.querySelector('.build-graph');
	const lines = root.querySelector('.build-lines');
	const codeEl = root.querySelector('[data-code]');
	const fileEl = root.querySelector('[data-file]');
	const logEl = root.querySelector('[data-log]');
	const statusEl = root.querySelector('[data-status]');
	const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	const SVG_NS = 'http://www.w3.org/2000/svg';

	// Copy the icon path from the sprite (a <use> clone wouldn't pick up our fill styles).
	function icon(name) {
		const svg = document.createElementNS(SVG_NS, 'svg');
		svg.setAttribute('viewBox', '0 0 24 24');
		svg.setAttribute('aria-hidden', 'true');
		svg.setAttribute('class', 'fill');
		const path = document.querySelector(`#i-${name} path`);
		if (path) svg.appendChild(path.cloneNode());
		return svg;
	}

	// Lay the tools out on an ellipse around the agent core.
	const nodes = {};
	TOOLS.forEach((name, i) => {
		const angle = (i / TOOLS.length) * Math.PI * 2 - Math.PI / 2 + Math.PI / TOOLS.length;
		const x = 50 + Math.cos(angle) * 40;
		const y = 50 + Math.sin(angle) * 37;

		const line = document.createElementNS(SVG_NS, 'line');
		line.setAttribute('x1', '50');
		line.setAttribute('y1', '50');
		line.setAttribute('x2', x.toFixed(2));
		line.setAttribute('y2', y.toFixed(2));
		line.setAttribute('vector-effect', 'non-scaling-stroke');
		lines.appendChild(line);

		const pulse = document.createElement('span');
		pulse.className = 'build-pulse';
		pulse.style.setProperty('--x', `${x}%`);
		pulse.style.setProperty('--y', `${y}%`);
		graph.appendChild(pulse);

		const tile = document.createElement('div');
		tile.className = 'build-tool';
		tile.style.left = `${x}%`;
		tile.style.top = `${y}%`;
		tile.appendChild(icon(name));
		graph.appendChild(tile);

		nodes[name] = { tile, line, pulse };
	});

	function setTool(name, state) {
		const n = nodes[TOOL_ALIAS[name] || name];
		if (!n) return;
		for (const el of [n.tile, n.line, n.pulse]) {
			el.classList.toggle('is-on', state !== 'off');
			el.classList.toggle('is-busy', state === 'busy');
		}
	}

	// Pausable wait: only counts time while the animation is on screen.
	let onScreen = true;
	new IntersectionObserver(([entry]) => {
		onScreen = entry.isIntersecting;
	}).observe(root);
	function wait(ms) {
		return new Promise((resolve) => {
			let left = ms;
			let last = performance.now();
			const tick = () => {
				const now = performance.now();
				if (onScreen && !document.hidden) left -= now - last;
				last = now;
				if (left <= 0) resolve();
				else setTimeout(tick, Math.min(left, 100));
			};
			setTimeout(tick, Math.min(ms, 100));
		});
	}

	const caret = document.createElement('span');
	caret.className = 'caret';

	async function typeCode(scenario, instant) {
		codeEl.textContent = '';
		fileEl.textContent = scenario.file;
		for (const tokens of scenario.code) {
			const lineEl = document.createElement('div');
			codeEl.appendChild(lineEl);
			if (!tokens.length) lineEl.innerHTML = '&nbsp;';
			for (const [text, cls] of tokens) {
				const span = document.createElement('span');
				if (cls) span.className = `c-${cls}`;
				lineEl.appendChild(span);
				if (instant) {
					span.textContent = text;
				} else {
					lineEl.appendChild(caret);
					for (const ch of text) {
						span.textContent += ch;
						await wait(ch === ' ' ? 18 : 26 + Math.random() * 40);
					}
				}
				if (cls === 't') setTool(text, 'on');
			}
			if (!instant) await wait(140);
		}
		if (!instant) codeEl.lastChild.appendChild(caret);
	}

	function addLogItem(tool, text) {
		const li = document.createElement('li');
		li.appendChild(icon(tool));
		const label = document.createElement('span');
		label.textContent = text;
		li.appendChild(label);
		const state = document.createElement('i');
		state.className = 'build-state';
		li.appendChild(state);
		logEl.appendChild(li);
		return li;
	}

	async function play(scenario) {
		await typeCode(scenario, false);
		await wait(500);
		root.classList.add('is-running');
		for (const [tool, text] of scenario.steps) {
			const li = addLogItem(tool, text);
			setTool(tool, 'busy');
			await wait(1300);
			li.classList.add('is-done');
			setTool(tool, 'on');
			await wait(250);
		}
		root.classList.remove('is-running');
		statusEl.textContent = scenario.done;
		statusEl.classList.add('is-visible');
		await wait(3200);

		root.classList.add('is-resetting');
		await wait(500);
		TOOLS.forEach((t) => setTool(t, 'off'));
		logEl.textContent = '';
		statusEl.classList.remove('is-visible');
		codeEl.textContent = '';
		root.classList.remove('is-resetting');
		await wait(300);
	}

	if (reduceMotion) {
		const scenario = SCENARIOS[0];
		typeCode(scenario, true);
		scenario.steps.forEach(([tool, text]) => addLogItem(tool, text).classList.add('is-done'));
		statusEl.textContent = scenario.done;
		statusEl.classList.add('is-visible');
		return;
	}

	(async function loop() {
		await wait(600);
		for (let i = 0; ; i = (i + 1) % SCENARIOS.length) await play(SCENARIOS[i]);
	})();
})();
