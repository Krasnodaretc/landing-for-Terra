/**
 * Created by Krasnodaretc on 28.08.17.
 */
module.exports = function () {
  var fullSlider = $('.landing-slider__wrap');
  var overblock = $('.overblock');
  var toOrderBtn = $('.overblock__button');
  var toNextSection = $('.landing-slider__mouse');

  var action = {
    // Меняет текст с названием слайда
    toggleText: function (currentIndex) {
      overblock.find('.active').removeClass('active').siblings('[data-index="' + currentIndex + '"]').addClass('active');
    },
    // Скрывает/раскрывает блок над слайдами
    toggleOverblock: function () {
      overblock.toggleClass('active');
    },
    /**
     * Скроллит окно к заданному элементу
     * @param elem {Object}
     * @param delay {Number || String} - время скролла
     */
    scrollTo: function (elem, delay) {
      // Высоту хедера определяем, чтобы после скролла он не перекрывал элемент
      var headerHeight = $('#mobile-nav').height() || 0;
      var animateTime = delay || 700;
      $('html, body').animate({scrollTop: elem.offset().top - headerHeight }, animateTime);
    },
    /**
     * Подготавливает данные для параллакса, запускает параллакс .
     * @param parent {Object} - Родительский контейнер элементов
     * @param elements { Array[] } - Элементы параллакса
     */
    parallaxInit: function (parent, elements) {
      if ( $(window).width() <= 991 ) return false;
      // Параллакс работает в диапазоне скролла окна:
      var parallaxEnd = parent.offset().top + $(window).height();
      var parallaxStart = parent.offset().top - $(window).height();

      var alreadyTransformX, alreadyTransformY, scrollSize;
      var elementsForScroll = [];
      // Определяем изначальное смещение элемента
      elements.each(function (index, el) {
        alreadyTransformX = parseInt( $(el).css('transform').split(',')[4] ) || 0;
        alreadyTransformY = parseInt( $(el).css('transform').split(',')[5] ) || 0;

        elementsForScroll.push({
          el: $(el),
          transX: alreadyTransformX,
          transY: alreadyTransformY,
          // Смещение элемента
          scrollSize: $(el).data('scroll')
        });
      });
      // Запускает параллакс
      action.parallaxScroll(parallaxStart, parallaxEnd, elementsForScroll);
    },
    /**
     * Parallax !
     * @param start {Number} - Стартовая точка параллакса
     * @param end {Number} - Конечная точка
     * @param elements { Array[] } - Массив объектов параллакса
     */
    parallaxScroll: function(start, end, elements) {
      $(window).scroll( function(){
        if ( $(window).width() <= 991 ) return false;
        var progress, currentTransform, parallax;
        var scroll = $(window).scrollTop();
        if ( scroll >= start && scroll < end ) {
          elements.forEach(function(el){
            // Определяем процент прокрутки
            progress = Math.round( ((scroll - start) / (end - start)) * 100);
            // В соответствии с процентом и заданным смещением элемента, находим смещение, в котором он должен быть сейчас
            currentTransform = el.transY - Math.round( el.scrollSize * progress / 100 );
            parallax = { transform: 'translate('+el.transX+'px,'+currentTransform+'px)'};

            $(el.el).css(parallax);
          });
        }

      });
    },
    /**
     * Появление элементов при скролле
     * @param element
     * @param delay
     */
    fade: function (element, delay) {
      var start = element.parent().offset().top - $(window).height();

      $(window).scroll( function () {
        if ( element.data('showed') ) return false;

        var scroll = $(window).scrollTop();
        if ( scroll > start ) {

          setTimeout( function () {
            element.addClass('active').data('showed', true);
            if (element.hasClass('landing-advantages__step-arrow') ) {
              setTimeout( function() {
                element.addClass('arrow--active');
              }, 700);
            }
          }, delay);
        }

      });
    }

  };

  fullSlider.on('beforeChange', function () {
    action.toggleOverblock();
  });

  fullSlider.on('afterChange', function () {
    var currentIndex = fullSlider.find('.slick-current').data('index');

    action.toggleOverblock();
    action.toggleText(currentIndex);
  });

  toNextSection.on('click', function () {
    var secondSection = $('main').children('section:nth-child(2)');
    action.scrollTo(secondSection);
  });

  toOrderBtn.on('click', function () {
    var order = $('.landing-order');
    action.scrollTo(order, 1100);
  });

  var parallaxRow = $('.row-parallax');
  var parallaxElements;
  // Сначала ждём прогрузку слайдера
  fullSlider.on('init', function () {
    parallaxRow.each(function () {
      parallaxElements = $(this).children('.parallax-text, .row-parallax__img, .row-parallax__letter');
      action.parallaxInit( $(this) , parallaxElements );
    });

    // Тоже нужно после слайдера, т.к. высчитывается offset().top
    // Появление иконок при скролле
    var toFade = $('.landing-advantages__title, .landing-advantages__step, .landing-advantages__step-arrow');
    var delay = 100;
    if( toFade.length ){

      toFade.each(function (index, el) {
        action.fade( $(this), delay );
        $(el).hasClass('.landing-advantages__step-arrow') ? delay += 100 : delay += 800;
      });
    }

  });

  // Кнопки фабрика и коллекция

  var collectionLink = $('input[name="collectionLink"]');

  $('.button-select').on('click', function () {
    $(this).children('.button-select__options-wrap').toggleClass('active');
  });

  $('.button-select__options-wrap').on('click', '.button-select__options', function () {
    var name = $(this).text();
    $('.button-select').removeClass('btn-warning');
    $(this).parents('.button-select').children('span').text(function () {
      return name;
    });
  });

  $('.button-select__options--fabric').on('click', '.button-select__options', function (){
    var id = $(this).data('value');
    var collectionsWrap = $('.button-select__options--collection');
    var collectionButton = $('.select-data__button.btn-yellow');
    collectionLink.data('ready', 'fabric');

    var fabricUrl = $(this).data('link');
    collectionLink.val(fabricUrl);

    collectionButton.addClass('button-disabled').children('span').text('Загрузка ...');

    $.post('/info/design-collection', {header: 'get collection', fabric: id }, function(data) {
      collectionButton.removeClass('button-disabled').children('span').text('Выберите коллекцию');
      // Очищает список перед добавлением
      collectionsWrap.text(' ');
      data.forEach(function (collection) {
        $('<div class="button-select__options" data-link="' + collection.urlPart + '" data-value="' + collection._id + '">' + collection.name + '</div>').appendTo(collectionsWrap);
        $('.select-data__button').removeClass('button--disabled');
      });

    });

  });

  $('.button-select__options--collection:not(.button--disabled)').on('click', '.button-select__options', function () {
    var fabricUrl = collectionLink.val();
    var collectionUrl = $(this).data('link');
    collectionLink.val(function () {
      return ('www.terracorp.ru/katalog/' + fabricUrl + '/' + collectionUrl);
    });
    if (~window.location.href.indexOf('test-landing')) {
      collectionLink.val('test-landing');
    }
    collectionLink.data('ready', 'collection');
  })
};