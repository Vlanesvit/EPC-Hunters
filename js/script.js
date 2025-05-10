
function initMenu() {
	const menus = document.querySelectorAll('.header__menu');

	// Бургер-кнопка
	function burger() {
		menus.forEach(menu => {
			const menuBurgerBtns = menu.querySelectorAll('.menu__burger_icon');
			if (menuBurgerBtns) {
				menuBurgerBtns.forEach(btn => {
					// Открываем меню
					btn.addEventListener("click", function (e) {
						e.preventDefault();
						menuToggle("menu-open");
					});
				});
			}
		});
	};
	burger()

	//========================================================================================================================================================
	// Функции открытия меню с блокировкой скролла
	function menuToggle(classes) {
		bodyLockToggle();
		document.documentElement.classList.toggle(classes);
	}
}
initMenu()

function initPopup() {
	document.addEventListener('click', function (e) {
		e.preventDefault();
		
		// Открытие модального окна
		const openBtn = e.target.closest('[data-popup]');
		if (openBtn) {
			const selector = openBtn.getAttribute('data-popup');
			const popup = document.querySelector(selector);
			if (popup) {
				popup.classList.add('popup_show');
				document.documentElement.classList.add('popup-show');
				bodyLock();
			}
			return;
		}

		// Закрытие модального окна по data-close
		if (e.target.closest('[data-close]')) {
			const popup = e.target.closest('.popup');
			if (popup) {
				popup.classList.remove('popup_show');
				document.documentElement.classList.remove('popup-show');
				bodyUnlock();
			}
			return;
		}

		// Закрытие при клике вне popup__content
		const popup = e.target.closest('.popup');
		if (popup && !e.target.closest('.popup__content')) {
			popup.classList.remove('popup_show');
			document.documentElement.classList.remove('popup-show');
			bodyUnlock();
		}
	});

	// Закрытие модалки по клавише Escape
	document.addEventListener('keydown', function (e) {
		if (e.key === 'Escape') {
			const activePopup = document.querySelector('.popup.popup-show');
			if (activePopup) {
				activePopup.classList.remove('popup_show');
				document.documentElement.classList.remove('popup-show');
				bodyUnlock();
			}
		}
	});
}
initPopup();

class Slider {
	constructor(selector, options) {
		// Устанавливаем настройки по умолчанию
		const defaultOptions = {
			slidesPerView: 1,
			spaceBetween: 0,
			autoplay: {
				enabled: false,
				autoplayDelay: 4000
			},
			loop: false,
			pagination: {
				enabled: true,
				type: 'bullet'
			},
			breakpoints: {}
		};

		this.options = { ...defaultOptions, ...options };
		this.slider = document.querySelector(selector);
		this.isInitialized = false;

		if (this.slider) {
			this.sliderWrapper = this.slider.querySelector('.slider-wrapper');
			this.slides = this.sliderWrapper.querySelectorAll('.slide');
			this.prevButton = this.slider.querySelector('.slider-arrow-prev');
			this.nextButton = this.slider.querySelector('.slider-arrow-next');
			this.pagination = this.slider.querySelector('.slider-pagination');

			this.currentIndex = 0;
			this.autoplayTimer = null;

			// Флаги и координаты для drag-событий
			this.isDragging = false;
			this.startX = 0;
			this.currentTranslate = 0;
			this.prevTranslate = 0;

			this.handleResize = this.handleResize.bind(this);
			this.applyBreakpointSettings(); // сразу применяем настройки по брейкпоинтам

			window.addEventListener('resize', this.handleResize);
		}
	}

	// Метод для инициализации слайдера
	init() {
		if (this.isInitialized) return;
		this.isInitialized = true;

		this.slider.classList.add('slider-init');

		this.updateSlider();
		this.updatePagination();
		this.updateFraction();
		this.updateButtonState();

		this.prevButton?.addEventListener('click', this.prevSlideBound = this.prevSlide.bind(this));
		this.nextButton?.addEventListener('click', this.nextSlideBound = this.nextSlide.bind(this));

		this.initDragEvents();

		if (this.options.autoplay.enabled) {
			this.startAutoplay();
			this.slider.addEventListener('mouseenter', this.stopAutoplayBound = this.stopAutoplay.bind(this));
			this.slider.addEventListener('mouseleave', this.startAutoplayBound = this.startAutoplay.bind(this));
		}
	}

	// Устанавливаем актуальные настройки по брейкпоинтам
	applyBreakpointSettings() {
		const breakpoints = this.options.breakpoints;
		const windowWidth = window.innerWidth;

		let activeBreakpoint = null;
		for (let point in breakpoints) {
			if (windowWidth >= +point) {
				activeBreakpoint = breakpoints[point];
			}
		}

		// Если в брейкпоинте указано destroy, отключаем слайдер
		if (activeBreakpoint?.destroy) {
			this.destroy();
		} else {
			// Применяем настройки из брейкпоинта (без перезаписи всех опций)
			Object.assign(this.options, activeBreakpoint || {});
			this.init();
		}
	}

	// Метод обновления ширины слайдов и позиционирования
	updateSlider() {
		const totalWidth = this.slider.clientWidth;
		const slideWidth = (totalWidth - (this.options.slidesPerView - 1) * this.options.spaceBetween) / this.options.slidesPerView;

		this.slides.forEach((slide, i) => {
			slide.style.width = `${slideWidth}px`;
			slide.style.marginRight = i < this.slides.length - 1 ? `${this.options.spaceBetween}px` : '0';
		});

		this.updateSliderPosition();
	}

	// Обновление позиции слайдов
	updateSliderPosition() {
		const offset = -this.currentIndex * (this.slides[0].offsetWidth + this.options.spaceBetween);
		this.sliderWrapper.style.transform = `translateX(${offset}px)`;
		this.sliderWrapper.style.transition = 'transform 0.3s ease';
	}

	// Следующий слайд
	nextSlide() {
		const totalPages = this.slides.length - this.options.slidesPerView + 1;
		if (this.currentIndex < totalPages - 1) {
			this.currentIndex++;
		} else if (this.options.loop) {
			this.currentIndex = 0;
		}
		this.updateSliderPosition();
		this.updatePagination();
		this.updateFraction();
		this.updateButtonState();
	}

	// Предыдущий слайд
	prevSlide() {
		const totalPages = this.slides.length - this.options.slidesPerView + 1;
		if (this.currentIndex > 0) {
			this.currentIndex--;
		} else if (this.options.loop) {
			this.currentIndex = totalPages - 1;
		}
		this.updateSliderPosition();
		this.updatePagination();
		this.updateFraction();
		this.updateButtonState();
	}

	// Запуск автопрокрутки
	startAutoplay() {
		this.autoplayTimer = setInterval(() => this.nextSlide(), this.options.autoplay.autoplayDelay);
	}

	// Остановка автопрокрутки
	stopAutoplay() {
		clearInterval(this.autoplayTimer);
	}

	// Обновление пагинации (точки)
	updatePagination() {
		if (!this.options.pagination.enabled || !this.pagination) return;

		this.pagination.innerHTML = '';
		const totalPages = Math.ceil(this.slides.length / this.options.slidesPerView);

		for (let i = 0; i < totalPages; i++) {
			const dot = document.createElement('span');
			dot.className = 'dot';
			if (i === Math.floor(this.currentIndex / this.options.slidesPerView)) {
				dot.classList.add('active');
			}
			dot.addEventListener('click', () => {
				this.currentIndex = i * this.options.slidesPerView;
				this.updateSliderPosition();
				this.updatePagination();
				this.updateFraction();
				this.updateButtonState();
			});
			this.pagination.appendChild(dot);
		}
		this.pagination.className = `slider-pagination slider-pagination-${this.options.pagination.type}`;
	}

	// Обновление пагинации (фракция)
	updateFraction() {
		if (!this.options.pagination.enabled || this.options.pagination.type !== 'fraction' || !this.pagination) return;

		const totalPages = this.slides.length - this.options.slidesPerView + 1;
		const currentPage = this.currentIndex + 1;

		this.pagination.innerHTML = `<span class="slider-pagination-fraction-count">${currentPage}</span> / ${totalPages}`;
	}

	// Активация/деактивация кнопок в зависимости от текущего слайда
	updateButtonState() {
		if (!this.options.loop) {
			this.prevButton?.classList.toggle('disable', this.currentIndex === 0);
			this.nextButton?.classList.toggle('disable', this.currentIndex >= this.slides.length - this.options.slidesPerView);
		}
	}

	// Добавление drag-событий (мышь и сенсор)
	initDragEvents() {
		const start = (clientX) => {
			this.isDragging = true;
			this.startX = clientX;
			this.prevTranslate = -this.currentIndex * (this.slides[0].offsetWidth + this.options.spaceBetween);
		};

		const move = (clientX) => {
			if (!this.isDragging) return;
			const delta = clientX - this.startX;
			this.currentTranslate = this.prevTranslate + delta;
			this.sliderWrapper.style.transition = 'none';
			this.sliderWrapper.style.transform = `translateX(${this.currentTranslate}px)`;
		};

		const end = () => {
			if (!this.isDragging) return;
			const movedBy = this.currentTranslate - this.prevTranslate;
			const threshold = this.slides[0].offsetWidth / 4;

			if (movedBy < -threshold) {
				this.nextSlide();
			} else if (movedBy > threshold) {
				this.prevSlide();
			} else {
				this.updateSliderPosition();
			}
			this.isDragging = false;
		};

		// Сохраняем ссылки на обработчики, чтобы удалить их при destroy
		this.dragHandlers = {
			mouseDown: e => start(e.clientX),
			mouseMove: e => move(e.clientX),
			mouseUp: end,
			mouseLeave: end,
			touchStart: e => start(e.touches[0].clientX),
			touchMove: e => move(e.touches[0].clientX),
			touchEnd: end,
		};

		this.sliderWrapper.addEventListener('mousedown', this.dragHandlers.mouseDown);
		this.sliderWrapper.addEventListener('mousemove', this.dragHandlers.mouseMove);
		this.sliderWrapper.addEventListener('mouseup', this.dragHandlers.mouseUp);
		this.sliderWrapper.addEventListener('mouseleave', this.dragHandlers.mouseLeave);
		this.sliderWrapper.addEventListener('touchstart', this.dragHandlers.touchStart);
		this.sliderWrapper.addEventListener('touchmove', this.dragHandlers.touchMove);
		this.sliderWrapper.addEventListener('touchend', this.dragHandlers.touchEnd);
	}

	// Уничтожение слайдера: удаляем стили, события и сбрасываем состояние
	destroy() {
		if (!this.isInitialized) return;
		this.isInitialized = false;

		this.slider.classList.remove('slider-init');
		this.sliderWrapper.style.transform = '';
		this.sliderWrapper.style.transition = '';
		this.slides.forEach(slide => slide.removeAttribute('style'));
		this.stopAutoplay();

		if (this.prevButton && this.prevSlideBound) {
			this.prevButton.removeEventListener('click', this.prevSlideBound);
		}
		if (this.nextButton && this.nextSlideBound) {
			this.nextButton.removeEventListener('click', this.nextSlideBound);
		}
		if (this.slider && this.stopAutoplayBound && this.startAutoplayBound) {
			this.slider.removeEventListener('mouseenter', this.stopAutoplayBound);
			this.slider.removeEventListener('mouseleave', this.startAutoplayBound);
		}
		if (this.dragHandlers) {
			this.sliderWrapper.removeEventListener('mousedown', this.dragHandlers.mouseDown);
			this.sliderWrapper.removeEventListener('mousemove', this.dragHandlers.mouseMove);
			this.sliderWrapper.removeEventListener('mouseup', this.dragHandlers.mouseUp);
			this.sliderWrapper.removeEventListener('mouseleave', this.dragHandlers.mouseLeave);
			this.sliderWrapper.removeEventListener('touchstart', this.dragHandlers.touchStart);
			this.sliderWrapper.removeEventListener('touchmove', this.dragHandlers.touchMove);
			this.sliderWrapper.removeEventListener('touchend', this.dragHandlers.touchEnd);
		}
		if (this.pagination) {
			this.pagination.innerHTML = '';
		}
	}

	// Обработка ресайза окна
	handleResize() {
		this.applyBreakpointSettings();
		if (this.isInitialized) {
			this.updateSlider();
			this.updatePagination();
			this.updateFraction();
			this.updateButtonState();
		}
	}
}


const slider = new Slider('.banner__slider', {
	slidesPerView: 1,
	spaceBetween: 30,
	breakpoints: {
		991.98: {
			destroy: true
		}
	}
});

//========================================================================================================================================================
// Вспомогательные модули блокировки прокрутки
let bodyLockStatus = true;
let bodyLockToggle = (delay = 300) => {
	if (document.documentElement.classList.contains('lock')) {
		bodyUnlock(delay);
	} else {
		bodyLock(delay);
	}
}
let bodyUnlock = (delay = 300) => {
	let body = document.querySelector("body");
	if (bodyLockStatus) {
		let lock_padding = document.querySelectorAll("[data-lp]");
		setTimeout(() => {
			for (let index = 0; index < lock_padding.length; index++) {
				const el = lock_padding[index];
				el.style.paddingRight = '0px';
			}
			body.style.paddingRight = '0px';
			document.documentElement.classList.remove("lock");
		}, delay);
		bodyLockStatus = false;
		setTimeout(function () {
			bodyLockStatus = true;
		}, delay);
	}
}
let bodyLock = (delay = 300) => {
	let body = document.querySelector("body");
	if (bodyLockStatus) {
		let lock_padding = document.querySelectorAll("[data-lp]");
		for (let index = 0; index < lock_padding.length; index++) {
			const el = lock_padding[index];
			// el.style.paddingRight = window.innerWidth - document.querySelector('.wrapper').offsetWidth + 'px';
		}
		body.style.paddingRight = window.innerWidth - document.querySelector('.wrapper').offsetWidth + 'px';
		document.documentElement.classList.add("lock");

		bodyLockStatus = false;
		setTimeout(function () {
			bodyLockStatus = true;
		}, delay);
	}
}