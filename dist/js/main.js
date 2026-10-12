(function () {
	// Reveal on scroll
	const items = document.querySelectorAll('.reveal');
	if ('IntersectionObserver' in window) {
		const io = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (!entry.isIntersecting) return;
					entry.target.classList.add('is-visible');
					io.unobserve(entry.target);
				});
			},
			{ threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
		);
		items.forEach((el) => {
			// Stagger siblings that enter together.
			const siblings = el.parentElement ? [...el.parentElement.children].filter((c) => c.classList.contains('reveal')) : [];
			el.style.setProperty('--delay', `${Math.max(0, siblings.indexOf(el)) * 70}ms`);
			io.observe(el);
		});
	} else {
		items.forEach((el) => el.classList.add('is-visible'));
	}

	// Cursor spotlight on cards
	document.querySelectorAll('.card').forEach((card) => {
		card.addEventListener('pointermove', (e) => {
			const r = card.getBoundingClientRect();
			card.style.setProperty('--mx', `${e.clientX - r.left}px`);
			card.style.setProperty('--my', `${e.clientY - r.top}px`);
		});
	});

	// Nav background once scrolled
	const nav = document.querySelector('.nav');
	const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 8);
	onScroll();
	window.addEventListener('scroll', onScroll, { passive: true });

	const year = document.querySelector('[data-year]');
	if (year) year.textContent = new Date().getFullYear();
})();
