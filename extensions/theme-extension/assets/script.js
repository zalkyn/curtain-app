
  class CurtainCustomizer extends HTMLElement {
    constructor() {
      super();
      this.appUrl = 'https://curtain-app-private-deae1f46dd84.herokuapp.com';
      this.otherModuleLoaded = false;
      this.data = this.data || {};
      this.collections = [];
      this.panelSize = this.panelSize || null;
      this.liningType = this.liningType || null;
      this.tieback = this.tieback || null;
      this.memoryShaped = this.memoryShaped || null;
      this.config = this.config || {};
      this.currentSwatches = this.currentSwatches || {};
      this.selectedTrackSize = null;
      this.selectedTrackPrice = null;
      this.panelTypeData = null;
      this.selectedPanelType = null;
      this.panelPosition = null;
      this.selected = {
        collection: { data: null, activeStatus: false, basePrice: 0 },
        swatch: { data: null, activeStatus: false, basePrice: 0 },
        panelSize: { data: null, activeStatus: false, basePrice: 0 },
        liftType: { data: null, activeStatus: false, basePrice: 0 },
        liningType: { data: null, activeStatus: false, basePrice: 0 },
        tieback: { data: null, activeStatus: false, basePrice: 0 },
        memoryShaped: { data: null, activeStatus: false, basePrice: 0 },
        roomLabel: { data: null, activeStatus: false, basePrice: 0 },
        trackSize: { data: null, activeStatus: false, basePrice: 0 },
        panelType: { data: null, activeStatus: false, basePrice: 0 },
        trim: { data: null, activeStatus: false, basePrice: 0 },
        border: { data: null, activeStatus: false, basePrice: 0 },
      };
      this.initCurtain();
    }

    connectedCallback() {
      this.updateTabVisibility(); // Set initial tab visibility
      this.handleEvents();
      setTimeout(() => {
        console.log('Curtain Customizer App Loaded==========');
        this.loadOthersModules().then(() => {
          this.orderTrackSizeUI();
          this.singlePanelOrPairUI();
          this.liftTypeUI();
          this.borderUI();
        });
      }, 10);
    }

    async initCurtain() {
      let response = await this.getData();
      if (response && this.collections.length > 0) {
        this.selected.collection.data = this.collections[0];
        this.selected.collection.activeStatus = true;
        console.log('Initial selected collection:', this.selected);
        this.collectionUI();
      }
    }

    handleEvents() {
      this.addEventListener('input', function (e) {
        if (e.target.closest('.ccapp-collection')) {
          this.handleCollectionInputEvents(e);
        }
        if (e.target.closest('.ccapp-sps-sizes-wrapper')) {
          console.log('event', JSON.parse(e.target.value));
        }
      });

      this.addEventListener(
        'change',
        function (e) {
          if (e.target.closest('.ccapp-sps-sizes-wrapper')) {
            this.handleSizeChange(e);
          }
          if (e.target.name === 'panel-type') {
            this.handlePanelTypeChange(e);
          }
          if (e.target.name === 'panel-position') {
            this.panelPosition = e.target.value;
          }
          // Handle fraction changes
          const widthFractionSelect = e.target.closest('.ccapp-ospswg-select.ccapp-fraction-select');
          const lengthFractionSelect = e.target.closest('.ccapp-ospslg-select.ccapp-fraction-select');
          if (widthFractionSelect || lengthFractionSelect) {
            const widthFraction = widthFractionSelect ? widthFractionSelect.value : this.selected.panelSize.data?.widthFraction;
            const lengthFraction = lengthFractionSelect ? lengthFractionSelect.value : this.selected.panelSize.data?.lengthFraction;
            if (this.config.spsOrderWidth && this.config.spsOrderLength) {
              this.selected.panelSize.data = {
                width: this.config.spsOrderWidth,
                length: this.config.spsOrderLength,
                widthFraction: widthFraction,
                lengthFraction: lengthFraction,
              };
              this.selected.panelSize.activeStatus = true;
              this.selected.panelSize.basePrice = this.panelSize?.basePrice || 0;
              console.log('Updated selected panel size (fraction):', this.selected);
            }
          }
        }.bind(this)
      );

      this.addEventListener('click', function (e) {
        if (e.target.closest('.ccapp-swatch')) {
          this.handleSwatchClickEvent(e);
        }
        const collectionTabTile = e.target.classList.contains('ccapp-ctth-svg')
          ? e.target
          : e.target.closest('.ccapp-ctth-svg');
        if (collectionTabTile) {
          const collectionTitleIndex = collectionTabTile.dataset?.index;
          this.handleCollectionUiTab(collectionTitleIndex);
        }
        const collectionButton = e.target.classList.contains('ccapp-collection-list-button')
          ? e.target
          : e.target.closest('.ccapp-collection-list-button');
        if (collectionButton) {
          this.handleCollectionButtonClick(collectionButton);
        }
        const ccapp_collectionInfoBtn = e.target.classList.contains('ccapp-cti-btn')
          ? e.target
          : e.target.closest('.ccapp-cti-btn');
        if (ccapp_collectionInfoBtn) {
          this.handleCollectionModal(ccapp_collectionInfoBtn);
        }
        const ccapp_swatchInfoBtn = e.target.classList.contains('ccapp-swatch-btn')
          ? e.target
          : e.target.closest('.ccapp-swatch-btn');
        if (ccapp_swatchInfoBtn) {
          this.handleSwatchModal(ccapp_swatchInfoBtn);
        }
        const ccapp_panelSizeGroupInfoBtn = e.target.classList.contains('ccapp-spsgi-btn')
          ? e.target
          : e.target.closest('.ccapp-spsgi-btn');
        if (ccapp_panelSizeGroupInfoBtn) {
          this.handlePanelSizeGroupModal(ccapp_panelSizeGroupInfoBtn);
        }
        const ccapp_panelSizeInfoBtn = e.target.classList.contains('ccapp-osps-modal-opener')
          ? e.target
          : e.target.closest('.ccapp-osps-modal-opener');
        if (ccapp_panelSizeInfoBtn) {
          this.handlePanelSizeModal(ccapp_panelSizeInfoBtn);
        }
        const ccapp_liningTypeModalBtn = e.target.classList.contains('ccapp-lt-modal-opener')
          ? e.target
          : e.target.closest('.ccapp-lt-modal-opener');
        if (ccapp_liningTypeModalBtn) {
          this.handleLiningTypeModal(ccapp_liningTypeModalBtn);
        }
        const ccapp_trackSizeModalBtn = e.target.classList.contains('ccapp-ots-modal-opener')
          ? e.target
          : e.target.closest('.ccapp-ots-modal-opener');
        if (ccapp_trackSizeModalBtn) {
          this.handleTrackSizeModal(ccapp_trackSizeModalBtn);
        }
        const ccapp_panelTypeModalBtn = e.target.classList.contains('ccapp-pt-modal-opener')
          ? e.target
          : e.target.closest('.ccapp-pt-modal-opener');
        if (ccapp_panelTypeModalBtn) {
          this.handlePanelTypeModal(ccapp_panelTypeModalBtn);
        }
        const ccapp_liftTypeModalBtn = e.target.classList.contains('ccapp-lift-modal-opener')
          ? e.target
          : e.target.closest('.ccapp-lift-modal-opener');
        if (ccapp_liftTypeModalBtn) {
          this.handleLiftTypeModal(ccapp_liftTypeModalBtn);
        }
        const ccapp_miTabHeading = e.target.classList.contains('mcct-icon-svg')
          ? e.target
          : e.target.closest('.mcct-icon-svg');
        if (ccapp_miTabHeading) {
          this.handleMITabs(ccapp_miTabHeading);
        }
        const ccapp_linigTypeItems = e.target.classList.contains('ccapp-lining-type-item')
          ? e.target
          : e.target.closest('.ccapp-lining-type-item');
        if (ccapp_linigTypeItems) {
          this.handleLinignTypeItemSelector(ccapp_linigTypeItems);
        }
        const ccapp_tieBackItems = e.target.classList.contains('ccapp-tieback-item')
          ? e.target
          : e.target.closest('.ccapp-tieback-item');
        if (ccapp_tieBackItems) {
          this.handleTieBackItemSelector(ccapp_tieBackItems);
        }
        const ccapp_memoryShapedItems = e.target.classList.contains('ccapp-memory-shaped-item')
          ? e.target
          : e.target.closest('.ccapp-memory-shaped-item');
        if (ccapp_memoryShapedItems) {
          this.handleMemoryShapedItemSelector(ccapp_memoryShapedItems);
        }
        const ccapp_otsButton = e.target.classList.contains('ccapp-ots-button')
          ? e.target
          : e.target.closest('.ccapp-ots-button');
        if (ccapp_otsButton) {
          this.handleOrderTrackSizeClick(ccapp_otsButton);
        }
        const ccapp_liftTypeItems = e.target.classList.contains('ccapp-lift-type-item')
          ? e.target
          : e.target.closest('.ccapp-lift-type-item');
        if (ccapp_liftTypeItems) {
          this.handleLiftTypeItemSelector(ccapp_liftTypeItems);
        }
        const ccapp_liftTypeButton =
          e.target.tagName === 'BUTTON' && e.target.closest('.ccapp-lift-type-btns-container')
            ? e.target
            : e.target.closest('.ccapp-lift-type-btns-container')?.querySelector('button');
        if (ccapp_liftTypeButton) {
          this.handleLiftTypeButtonClick(ccapp_liftTypeButton);
        }
        const ccapp_trimModalBtn = e.target.classList.contains('ccapp-trim-modal-opener')
          ? e.target
          : e.target.closest('.ccapp-trim-modal-opener');
        if (ccapp_trimModalBtn) {
          this.handleTrimModal(ccapp_trimModalBtn);
        }
        const ccapp_borderModalBtn = e.target.classList.contains('ccapp-border-modal-opener')
          ? e.target
          : e.target.closest('.ccapp-border-modal-opener');
        if (ccapp_borderModalBtn) {
          this.handleBorderModal(ccapp_borderModalBtn);
        }
      }.bind(this));
    }

    handleLinignTypeItemSelector(btn) {
      const activeIndex = parseInt(btn.dataset?.index) || 0;
      this.querySelectorAll('.ccapp-lining-type-item').forEach((item, index) => {
        if (index === activeIndex) {
          item.classList.add('active');
          this.selected.liningType.data = this.liningType.items[activeIndex];
          this.selected.liningType.activeStatus = true;
          this.selected.liningType.basePrice = this.liningType.items[activeIndex]?.price || 0;
          console.log('Updated selected lining type:', this.selected);
        } else {
          item.classList.remove('active');
        }
      });
    }

    handleTieBackItemSelector(btn) {
      const activeIndex = parseInt(btn.dataset?.index) || 0;
      const tieback = this.tieback || {};
      const tiebackItems = [
        {
          image: tieback?.primaryImage,
          title: tieback?.primaryTitle,
          isActive: tieback?.isTie ?? true,
          price: tieback?.primaryPrice || 0, // Use primaryPrice
        },
        {
          image: tieback?.secondaryImage,
          title: tieback?.secondaryTitle,
          isActive: tieback?.isTie === false,
          price: tieback?.secondaryPrice || 0, // Use secondaryPrice
        },
      ];
    
      this.querySelectorAll('.ccapp-tieback-item').forEach((item, index) => {
        if (index === activeIndex) {
          item.classList.add('active');
          this.selected.tieback.data = tiebackItems[activeIndex];
          this.selected.tieback.activeStatus = true;
          this.selected.tieback.basePrice = tiebackItems[activeIndex].price; // Set price based on selection
          console.log('Updated selected tieback:', this.selected.tieback);
        } else {
          item.classList.remove('active');
        }
      });
    }

    handleMemoryShapedItemSelector(btn) {
      const activeIndex = parseInt(btn.dataset?.index) || 0;
      const memoryShaped = this.memoryShaped || {};
      const memoryShapedItems = [
        {
          image: memoryShaped?.primaryImage,
          title: memoryShaped?.primaryTitle,
          isActive: memoryShaped?.isTie ?? true,
        },
        {
          image: memoryShaped?.secondaryImage,
          title: memoryShaped?.secondaryTitle,
          isActive: memoryShaped?.isTie === false,
        },
      ];
    
      // Calculate price: 0 for secondary item, otherwise use priceRules
      let basePrice = 0;
      if (activeIndex === 0 && this.config.spsOrderLength && memoryShaped?.priceRules) {
        const selectedLength = this.config.spsOrderLength.Length;
        const rule = memoryShaped.priceRules.find(
          (rule) => selectedLength >= rule.lengthMin && selectedLength <= rule.lengthMax
        );
        basePrice = rule ? rule.price || 0 : 0;
      }
    
      this.querySelectorAll('.ccapp-memory-shaped-item').forEach((item, index) => {
        if (index === activeIndex) {
          item.classList.add('active');
          this.selected.memoryShaped.data = memoryShapedItems[activeIndex];
          this.selected.memoryShaped.activeStatus = true;
          this.selected.memoryShaped.basePrice = basePrice;
          console.log('Updated selected memoryShaped:', this.selected.memoryShaped);
        } else {
          item.classList.remove('active');
        }
      });
    }

    handleMITabs(btn) {
      const wrapper = btn.closest('.ccapp-msc-tab');
      const tabIndex = wrapper.dataset?.index || 1;
      this.handleMITabsOpener(tabIndex);
    }

    handleMITabsOpener(tabIndex) {
      const allTabls = this.querySelectorAll('.ccapp-msc-tab');
      if (allTabls) {
        allTabls.forEach((tab, index) => {
          const tabContent = tab.querySelector('.ccapp-msc-tab-content');
          if (tab.dataset?.index === tabIndex) {
            tab.classList.toggle('active');
            if (tab.classList.contains('active')) {
              if (tabContent) tabContent.style.height = `${tabContent.scrollHeight}px`;
            } else {
              if (tabContent) tabContent.style.height = `0px`;
            }
          } else {
            tab.classList.remove('active');
            if (tabContent) tabContent.style.height = `0px`;
          }
        });
      }
    }

    handleCollectionButtonClick(btn) {
      const { collectionId, listId, index } = btn.dataset;
      const selectedCollection = this.collections.find(c => c.id?.toString() === collectionId?.toString());
      if (selectedCollection) {
        this.selected.collection.data = selectedCollection;
        this.selected.collection.activeStatus = true;
        console.log('Updated selected collection:', this.selected);
      }
      this.handleSwatches(collectionId, listId);

      // Update active state
      this.querySelectorAll('.ccapp-collection-list-button').forEach(button => {
        button.classList.remove('active');
      });
      btn.classList.add('active');
    }


    handleCollectionModal(btn) {
      const { collectionId } = btn.dataset;
      const collection = this.collections?.find((c) => c.id?.toString() === collectionId?.toString());
      if (collection) {
        this.generateCollectionModalData(collection);
      }
    }

    generateCollectionModalData(collection) {
      let contentUl = `<div class="ccapp-cmc">
        <div class="ccapp-cmc-info">
          <h3 class="ccapp-cmc-title">${collection?.title}</h3>
          <div class="ccapp-cmc-description">
            ${collection?.info || 'Loading...'}
          </div>
        </div>
      </div>`;

      this.loadDrawerData(contentUl);
    }

    handleSwatchModal(btn) {
      const { swatchId, listId, collectionId } = btn.dataset;
      const { collection, list } = this.getSelectedSwatch(collectionId, listId);

      let swatch_ = this.currentSwatches?.swatches?.find((sw) => sw.id === parseInt(swatchId));

      if (swatch_) {
        this.generateSwatchModalData(swatch_, list, collection);
      }
    }

    handlePanelSizeModal(btn) {
      this.generatePanelSizeModalData();
    }

    handleLiningTypeModal(btn) {
      this.generateLiningTypeModalData();
    }

    handleTrackSizeModal(btn) {
      this.generateTrackSizeModalData();
    }

    handlePanelTypeModal(btn) {
      this.generatePanelTypeModalData();
    }

    handleLiftTypeModal(btn) {
      this.generateLiftTypeModalData();
    }

    handleTrimModal(btn) {
      this.generateTrimModalData();
    }

    handleBorderModal(btn) {
      this.generateBorderModalData();
    }

    generatePanelSizeModalData() {
      let contentUl = `<div class="ccapp-cmc">
        <div class="ccapp-cmc-info">
          <h3 class="ccapp-cmc-title">Order panel size info</h3>
          <div class="ccapp-cmc-description">
            ${this.panelSize?.info || 'Loading...'}
          </div>
        </div>
      </div>`;

      this.loadDrawerData(contentUl);
    }

    generateLiningTypeModalData() {
      let contentUl = `<div class="ccapp-cmc">
        <div class="ccapp-cmc-info">
          <h3 class="ccapp-cmc-title">Lining Type Information</h3>
          <div class="ccapp-cmc-description">
            ${this.liningType?.info || 'Loading...'}
          </div>
        </div>
      </div>`;

      this.loadDrawerData(contentUl);
    }

    generateTrackSizeModalData() {
      let contentUl = `<div class="ccapp-cmc">
        <div class="ccapp-cmc-info">
          <h3 class="ccapp-cmc-title">Order Track Size Information</h3>
          <div class="ccapp-cmc-description">
            ${this.trackSize?.info || 'Loading...'}
          </div>
        </div>
      </div>`;

      this.loadDrawerData(contentUl);
    }

    generatePanelTypeModalData() {
      console.log('this.panelTypeData in generatePanelTypeModalData:', this.panelTypeData);
      let contentUl = `<div class="ccapp-cmc">
        <div class="ccapp-cmc-info">
          <h3 class="ccapp-cmc-title">Panel Type Information</h3>
          <div class="ccapp-cmc-description">
            ${this.panelTypeData?.info || 'Loading...'}
          </div>
        </div>
      </div>`;

      this.loadDrawerData(contentUl);
    }

    generateLiftTypeModalData() {
      let contentUl = `<div class="ccapp-cmc">
        <div class="ccapp-cmc-info">
          <h3 class="ccapp-cmc-title">Lift Type Information</h3>
          <div class="ccapp-cmc-description">
            ${this.liftType?.info || 'Loading...'}
          </div>
        </div>
      </div>`;

      this.loadDrawerData(contentUl);
    }

    generateTrimModalData() {
      let contentUl = `<div class="ccapp-cmc">
        <div class="ccapp-cmc-info">
          <h3 class="ccapp-cmc-title">Trim Information</h3>
          <div class="ccapp-cmc-description">
            ${this.trim?.info || 'Loading...'}
          </div>
        </div>
      </div>`;

      this.loadDrawerData(contentUl);
    }

    generateBorderModalData() {
      let contentUl = `<div class="ccapp-cmc">
        <div class="ccapp-cmc-info">
          <h3 class="ccapp-cmc-title">Border Details</h3>
          <div class="ccapp-cmc-description">
            ${this.border?.info || 'Loading...'}
          </div>
        </div>
      </div>`;

      this.loadDrawerData(contentUl);
    }

    handlePanelSizeGroupModal(btn) {
      const { type } = btn.dataset;
      const info = type === 'width' ? this.panelSize?.widthInfo : this.panelSize?.lengthInfo;
      if (info) {
        this.generatePanelSizeGroupModalData(info, type);
      }
    }

    generatePanelSizeGroupModalData(info, type) {
      let contentUl = `<div class="ccapp-cmc">
        <div class="ccapp-cmc-info">
          <h3 class="ccapp-cmc-title">Order panel size ${type} info</h3>
          <div class="ccapp-cmc-description">
            ${info || 'Loading...'}
          </div>
        </div>
      </div>`;

      this.loadDrawerData(contentUl);
    }

    generateSwatchModalData(swatch, list, collection) {
      let contentUl = `<div class="ccapp-smc">
          <div class="ccapp-smc-media">
            <img
              src="${swatch?.image64}"
              width="300"
            >
          </div>
          <div class="ccapp-smc-info">
            <h3 class="ccapp-smc-title">${list?.title} / ${swatch?.title}</h3>
            <div class="ccapp-smc-description">${swatch?.info}</div>
          </div>
        </div>`;

      this.loadModalData(contentUl);
    }

    loadModalData(dataUI) {
      if (document.querySelector('.ccapp-modal-data')) {
        document.querySelector('.ccapp-modal-data').innerHTML = dataUI;
      }

      this.handleModalOpener();
    }

    loadDrawerData(dataUI) {
      if (document.querySelector('.ccapp-drawer-data')) {
        document.querySelector('.ccapp-drawer-data').innerHTML = dataUI;
      }

      this.handleDrawerOpener();
    }

    handleDrawerOpener() {
      if (document.querySelector('.ccapp-drawer-container')) {
        document.querySelector('.ccapp-drawer-container').classList.toggle('active');
      }
    }

    handleModalOpener() {
      if (document.querySelector('.ccapp-modal-container')) {
        document.querySelector('.ccapp-modal-container').classList.toggle('active');
      }
    }

    collectionUI() {
      let element = '';
      this.collections?.map((collection, index) => {
        let listsEl = this.collectionListUI(collection, index);
        element += `<div class="ccapp-collection">
                <div class="ccapp-collection-title" data-index="${index}">
                <div class="ccapp-ct-wrapper">
                  <p class="ccapp-ct-p">${collection?.title}</p>
                  <button class="ccapp-cti-btn" data-collection-id="${collection.id}">
                    <svg fill="#000000" width="20px" height="20px" viewBox="-1 0 19 19" xmlns="http://www.w3.org/2000/svg" class="cf-icon-svg"><path d="M16.417 9.583A7.917 7.917 0 1 1 8.5 1.666a7.917 7.917 0 0 1 7.917 7.917zM5.85 3.309a6.833 6.833 0 1 0 2.65-.534 6.787 6.787 0 0 0-2.65.534zm2.654 1.336A1.136 1.136 0 1 1 7.37 5.78a1.136 1.136 0 0 1 1.135-1.136zm.792 9.223V8.665a.792.792 0 1 0-1.583 0v5.203a.792.792 0 0 0 1.583 0z"/></svg>
                  </button>
                </div>
                <svg class="ccapp-ctth-svg" data-index="${index}" width="20px" height="20px" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M10 14a.997.997 0 01-.707-.293l-5-5a.999.999 0 111.414-1.414L10 11.586l4.293-4.293a.999.999 0 111.414 1.414l-5 5A.997.997 0 0110 14z" fill="#5C5F62"/></svg>
                </div>
                <div class="ccapp-collection-list-wrapper">${listsEl}</div>
            </div>`;
      });


      if(this.querySelector('.ccapp-collections-wrapper')){
        this.querySelector('.ccapp-collections-wrapper').innerHTML = element;
      }
      this.ccappCollectionsUls = this.querySelectorAll('.ccapp-collection');
      this.handleMITabsOpener('1');
      this.handleCollectionUiTab();
    }

    handleCollectionUiTab(_index = 0) {
      if (this.ccappCollectionsUls) {
        this.ccappCollectionsUls.forEach((cui, index) => {
          let listWrapper = cui.querySelector('.ccapp-collection-list-wrapper');
          if (index === parseInt(_index)) {
            cui.classList.toggle('active');
            if (cui.classList.contains('active')) {
              if (listWrapper) listWrapper.style.height = `${listWrapper.scrollHeight}px`;
            } else {
              if (listWrapper) listWrapper.style.height = '0';
            }
          } else {
            cui.classList.remove('active');
            if (listWrapper) listWrapper.style.height = '0';
          }
        });
      }
    }

    collectionListUI(collection, _index) {
      let el = '';
      collection?.collectionList?.map((list, index) => {
        if (index === 0 && _index === 0) {
          this.handleSwatches(collection.id, list.id);
        }
        el += `<div class="ccapp-collection-list">
                <button class="ccapp-collection-list-button ${index === 0 && _index === 0 ? 'active' : ''}" data-collection-id="${collection.id}" data-list-id="${list.id}" data-index="${index}">
                  ${list.title}
                </button>
              </div>`;
      });

      return el;
    }

    handleSwatchClickEvent(e) {
      let src = e.target.src || null;
      if (src != null) {
        const imageUrl = encodeURI(src);
        this.uploadSwatchToMoc(imageUrl);
        this.activeSwatchBorder(e);
        const swatch = this.currentSwatches.swatches.find(s => s.image64 === src);
        if (swatch) {
          this.selected.swatch.data = swatch; // Update swatch data
          this.selected.swatch.activeStatus = true;
          this.selected.swatch.basePrice = swatch?.price || 0; // Update base price
          console.log('Updated selected swatch:', this.selected);
        }
      }
    }

    activeSwatchBorder(e) {
      const swatchImages = this.querySelectorAll('.ccapp-swatch-image');
      if (swatchImages) {
        swatchImages.forEach((img) => {
          img.classList.remove('active');
        });
      }
      const activeSwatch = e.target.closest('.ccapp-swatch-image');
      if (activeSwatch) {
        activeSwatch.classList.add('active');
      }
    }

    uploadSwatchToMoc(imageUrl) {
      this.querySelector('.thumb-container .curtain-fill').style.backgroundImage = `url("${imageUrl}")`;
    }

    handleCollectionInputEvents(e) {
      const { value, name } = e.target;
      const { collectionId, listId } = e.target.dataset;
      const selectedCollection = this.collections.find(c => c.id?.toString() === collectionId?.toString());
      if (selectedCollection) {
        this.selected.collection.data = selectedCollection;
        this.selected.collection.activeStatus = true;
        console.log('Updated selected collection:', this.selected);
      }
      this.handleSwatches(collectionId, listId);
    }

    async handleSwatches(collectionId, listId) {
      if (this.querySelector('.ccapp-swatch-wrapper')) {
        this.querySelector('.ccapp-swatch-wrapper').innerHTML = 'Loading';
      }
    
      const response = await fetch(`${this.appUrl}/api/swatches/${listId}`);
      const data = await response.json();
      const swatches = data?.swatches || [];
    
      const { collection, list } = this.getSelectedSwatch(collectionId, listId);
    
      if (swatches?.length > 0) {
        if (swatches[0]?.image64) {
          this.uploadSwatchToMoc(swatches[0]?.image64);
        }
        this.selected.swatch.data = swatches[0]; // Set initial swatch data
        this.selected.swatch.activeStatus = true;
        this.selected.swatch.basePrice = swatches[0]?.price || 0; // Set initial base price
        console.log('Initial selected swatch:', this.selected);
      }
    
      this.currentSwatches = {
        collectionId: collection.id,
        listId: list.id,
        swatches: swatches,
      };
    
      this.swatchUI(collection, list, swatches);
      const tab = this.querySelector('.ccapp-msc-tab.active');
      this.handleResizeHeightCollectionTab(tab);
    }

    getSelectedSwatch(collectionId, listId) {
      let collection = this.collections?.find((c) => c.id?.toString() === collectionId?.toString());
      let list = collection?.collectionList?.find((l) => l.id?.toString() === listId?.toString());
      return { collection, list };
    }

    swatchUI(collection, list, swatches) {
      let swatchEl = '';
      swatches?.map((swatch, index) => {
        if (swatch.image64) {
          swatchEl += `<div class="ccapp-swatch" data-image="${swatch?.image64}">
                <img src="${swatch?.image64}" class="ccapp-swatch-image ${index === 0 ? 'active' : ''}" width="100">
                <div class="ccapp-swatch-infos">
                  <p class="ccapp-swatch-title">${swatch?.title}</p>
                  <button class="ccapp-swatch-btn" data-swatch-id="${swatch.id}" data-list-id="${
            list.id
          }" data-collection-id="${collection.id}">
                    <svg fill="#000000" width="16px" height="16px" viewBox="0 0 32 32" version="1.1" xmlns="http://www.w3.org/2000/svg">
                      <title>zoomin</title>
                      <path d="M16.906 20.188l5.5 5.5-2.25 2.281-5.75-5.781c-1.406 0.781-3.031 1.219-4.719 1.219-5.344 0-9.688-4.344-9.688-9.688s4.344-9.688 9.688-9.688 9.719 4.344 9.719 9.688c0 2.5-0.969 4.781-2.5 6.469zM2.688 13.719c0 3.875 3.125 6.969 7 6.969 3.844 0 7-3.094 7-6.969s-3.156-6.969-7-6.969c-3.875 0-7 3.094-7 6.969zM10.813 12.625h3.875v2.219h-3.875v3.844h-2.219v-3.844h-3.844v-2.219h3.844v-3.875h2.219v3.875z"></path>
                    </svg>
                  </button>
                </div>
            </div>`;
        }
      });

      if (this.querySelector('.ccapp-swatch-wrapper')) {
        this.querySelector('.ccapp-swatch-wrapper').innerHTML =
          swatchEl?.length < 10 ? `<h4>No Swatches!</h4>` : swatchEl;
      }
    }

    singlePanelSizeUI() {
      if (!this.panelSize || !this.panelSize.activeStatus) {
        this.selected.panelSize = { data: null, activeStatus: false, basePrice: 0 };
        console.log('Reset selected.panelSize for hidden tab:', this.selected.panelSize);
        this.querySelector('.ccapp-sps-sizes-wrapper').innerHTML = '<div>Loading...</div>';
        return;
      }

      if (this.panelSize) {
        if (this.querySelector('.ccapp-sps-diagram')) {
          this.querySelector('.ccapp-sps-diagram').innerHTML = `<img src="${this.panelSize?.image64}">`;
        }
    
        let widthGroupEl = '';
        let widthOptionEl = '';
        let widthFractionOptions = this.panelSize?.widthFraction
          ? this.panelSize.widthFraction
              .split(',')
              .map((option) => option.trim())
              .filter(Boolean)
          : [];
        let initialWidthFraction = widthFractionOptions.length > 0 ? widthFractionOptions[0] : '';
    
        this.config.spsOrderWidth =
          this.panelSize?.widthGroup?.length > 0 ? this.panelSize?.widthGroup[0]?.group[0] : null;
        this.config.spsOrderLength =
          this.panelSize?.lengthGroup?.length > 0 ? this.panelSize?.lengthGroup[0]?.group[0] : null;
    
        this.panelSize?.widthGroup?.map((group, index) => {
          group?.group?.map((g, i) => {
            widthOptionEl += `<option value='${JSON.stringify(g)}'>${g.width}</option>`;
          });
        });
    
        let lengthOptionEl = '';
        let lengthFractionOptions = this.panelSize?.lengthFraction
          ? this.panelSize.lengthFraction
              .split(',')
              .map((option) => option.trim())
              .filter(Boolean)
          : [];
        let initialLengthFraction = lengthFractionOptions.length > 0 ? lengthFractionOptions[0] : '';
        this.panelSize?.lengthGroup?.map((group, index) => {
          group?.group?.map((g, i) => {
            lengthOptionEl += `<option value='${JSON.stringify(g)}'>${g.Length}</option>`;
          });
        });
    
        const widthGroupSelect = `<div class="ccapp-sps-input-wrapper">
          <label class="ccapp-spswgi-label">
            <div class="ccapp-spswgi-ltitle">
              <strong>Order Width:</strong>
              <span class="ccapp-width-display">${this.config?.spsOrderWidth?.width || 'N/A'} Inches</span>
            </div>
            <button class="ccapp-spsgi-btn" data-type="width">
              <svg fill="#000000" width="20px" height="20px" viewBox="-1 0 19 19" xmlns="http://www.w3.org/2000/svg" class="cf-icon-svg"><path d="M16.417 9.583A7.917 7.917 0 1 1 8.5 1.666a7.917 7.917 0 0 1 7.917 7.917zM5.85 3.309a6.833 6.833 0 1 0 2.65-.534 6.787 6.787 0 0 0-2.65.534zm2.654 1.336A1.136 1.136 0 1 1 7.37 5.78a1.136 1.136 0 0 1 1.135-1.136zm.792 9.223V8.665a.792.792 0 1 0-1.583 0v5.203a.792.792 0 0 0 1.583 0z"/></svg>
            </button>
          </label>
          <select class="ccapp-ospswg-select" name="ccapp-width-group">${widthOptionEl}</select>
          ${
            widthFractionOptions.length > 0
              ? `<select class="ccapp-ospswg-select ccapp-fraction-select" name="ccapp-width-fraction">${widthFractionOptions
                  .map((opt, index) => `<option value="${opt}" ${index === 0 ? 'selected' : ''}>${opt}</option>`)
                  .join('')}</select>`
              : ''
          }
        </div>`;
    
        const lengthGroupSelect = `<div class="ccapp-sps-input-wrapper">
          <label class="ccapp-spslgi-label">
            <div class="ccapp-spslgi-ltitle">
              <strong>Order Length:</strong>
              <span class="ccapp-length-display">${this.config?.spsOrderLength?.Length || 'N/A'} Inches</span>
            </div>
            <button class="ccapp-spsgi-btn" data-type="length">
              <svg fill="#000000" width="20px" height="20px" viewBox="-1 0 19 19" xmlns="http://www.w3.org/2000/svg" class="cf-icon-svg"><path d="M16.417 9.583A7.917 7.917 0 1 1 8.5 1.666a7.917 7.917 0 0 1 7.917 7.917zM5.85 3.309a6.833 6.833 0 1 0 2.65-.534 6.787 6.787 0 0 0-2.65.534zm2.654 1.336A1.136 1.136 0 1 1 7.37 5.78a1.136 1.136 0 0 1 1.135-1.136zm.792 9.223V8.665a.792.792 0 1 0-1.583 0v5.203a.792.792 0 0 0 1.583 0z"/></svg>
            </button>
          </label>
          <select class="ccapp-ospslg-select" name="ccapp-length-group">${lengthOptionEl}</select>
          ${
            lengthFractionOptions.length > 0
              ? `<select class="ccapp-ospslg-select ccapp-fraction-select" name="ccapp-length-fraction">${lengthFractionOptions
                  .map((opt, index) => `<option value="${opt}" ${index === 0 ? 'selected' : ''}>${opt}</option>`)
                  .join('')}</select>`
              : ''
          }
        </div>`;
    
        if(this.querySelector('.ccapp-sps-sizes-wrapper')){
            this.querySelector('.ccapp-sps-sizes-wrapper').innerHTML = `<div class="ccapp-sps-size-wrapper">
            ${widthGroupSelect}
            ${lengthGroupSelect}
          </div>`;      
        }
    
        // Set initial panel size data with fractions
        const widthFractionSelect = this.querySelector('.ccapp-ospswg-select.ccapp-fraction-select');
        const lengthFractionSelect = this.querySelector('.ccapp-ospslg-select.ccapp-fraction-select');
        if (this.config.spsOrderWidth && this.config.spsOrderLength) {
          this.selected.panelSize.data = {
            width: this.config.spsOrderWidth,
            length: this.config.spsOrderLength,
            widthFraction: widthFractionSelect ? widthFractionSelect.value : null,
            lengthFraction: lengthFractionSelect ? lengthFractionSelect.value : null,
          };
          this.selected.panelSize.activeStatus = true;
          this.selected.panelSize.basePrice = this.panelSize?.basePrice || 0; // Use panelSize base price if available
          console.log('Initial selected panel size:', this.selected)
        }
    
        // Set initial visibility
        this.updateMemoryShapedVisibility();
      }
    }

    handleSizeChange(e) {
      const select = e.target.closest('select');
      if (select) {
        if (select.classList.contains('ccapp-ospswg-select')) {
          const value = JSON.parse(select.value);
          this.config.spsOrderWidth = value;
          this.querySelector('.ccapp-width-display').textContent = `${value.width || 'N/A'} Inches`;
          const widthFractionSelect = this.querySelector('.ccapp-ospswg-select.ccapp-fraction-select');
          const widthFraction = widthFractionSelect ? widthFractionSelect.value : null;
          if (this.config.spsOrderLength) {
            this.selected.panelSize.data = {
              width: this.config.spsOrderWidth,
              length: this.config.spsOrderLength,
              widthFraction: widthFraction,
              lengthFraction: this.selected.panelSize.data?.lengthFraction || null,
            };
            this.selected.panelSize.activeStatus = true;
            this.selected.panelSize.basePrice = this.panelSize?.basePrice || 0;
            console.log('Updated selected panel size (width):', this.selected);
          }
        } else if (select.classList.contains('ccapp-ospslg-select')) {
          const value = JSON.parse(select.value);
          this.config.spsOrderLength = value;
          this.querySelector('.ccapp-length-display').textContent = `${value.Length || 'N/A'} Inches`;
          const lengthFractionSelect = this.querySelector('.ccapp-ospslg-select.ccapp-fraction-select');
          const lengthFraction = lengthFractionSelect ? lengthFractionSelect.value : null;
          if (this.config.spsOrderWidth) {
            this.selected.panelSize.data = {
              width: this.config.spsOrderWidth,
              length: this.config.spsOrderLength,
              widthFraction: this.selected.panelSize.data?.widthFraction || null,
              lengthFraction: lengthFraction,
            };
            this.selected.panelSize.activeStatus = true;
            this.selected.panelSize.basePrice = this.panelSize?.basePrice || 0;
            console.log('Updated selected panel size (length):', this.selected);
          }
        }
        this.updateMemoryShapedVisibility();
      }
    }

    liningTypeUI() {
      console.log('liningType===', this.liningType);
      if (!this.liningType || !this.liningType.activeStatus) {
        this.selected.liningType = { data: null, activeStatus: false, basePrice: 0 };
        console.log('Reset selected.liningType for hidden tab:', this.selected.liningType);
        this.querySelector('.ccapp-lining-type-wrapper').innerHTML = '<div>Loading...</div>';
        return;
      }
    
      let liningTypeEl = '';
      this.liningType?.items?.map((item, index) => {
        liningTypeEl += `<div class="ccapp-lining-type-item ${index === 0 ? 'active' : ''}" data-index="${index}">
          <img class="ccapp-lining-type-image" src="${item?.image64}" width="100">
          <p class="ccapp-lining-type-title">${item?.title}</p>
          <div class="ccapp-lining-type-sr">SR: ${item?.sr}</div>
        </div>`;
      });
    
      if (this.querySelector('.ccapp-lining-type-wrapper')) {
        this.querySelector('.ccapp-lining-type-wrapper').innerHTML = liningTypeEl;
      }
    
      // Set initial lining type data
      if (this.liningType?.items?.length > 0) {
        this.selected.liningType.data = this.liningType.items[0];
        this.selected.liningType.activeStatus = true;
        this.selected.liningType.basePrice = this.liningType.items[0]?.price || 0;
        console.log('Initial selected lining type:', this.selected);
      }
    }

    tiebackUI() {
      if (!this.tieback || !this.tieback.activeStatus) {
        this.selected.tieback = { data: null, activeStatus: false, basePrice: 0 };
        console.log('Reset selected.tieback for hidden tab:', this.selected.tieback);
        this.querySelector('.ccapp-tieback-wrapper').innerHTML = '<div>Loading...</div>';
        return;
      }
      const tieback = this.tieback || {};
      const tiebackItems = [
        {
          image: tieback?.primaryImage,
          title: tieback?.primaryTitle,
          isActive: tieback?.isTie ?? true,
          price: tieback?.primaryPrice || 0,
        },
        {
          image: tieback?.secondaryImage,
          title: tieback?.secondaryTitle,
          isActive: tieback?.isTie === false,
          price: tieback?.secondaryPrice || 0,
        },
      ];
      let uiEL = '';
      tiebackItems.forEach((item, index) => {
        uiEL += `<div class="ccapp-tieback-item ${item.isActive ? 'active' : ''}" data-index="${index}">
          <img class="ccapp-tieback-image" src="${item.image || ''}" width="100">
          <p class="ccapp-tieback-title">${item.title || ''}</p>
        </div>`;
      });
      const wrapper = this.querySelector('.ccapp-tieback-wrapper');
      if (wrapper) {
        wrapper.innerHTML = uiEL;
      }
      if (tiebackItems.length > 0) {
        const initialTieback = tiebackItems.find(item => item.isActive) || tiebackItems[0];
        this.selected.tieback.data = initialTieback;
        this.selected.tieback.activeStatus = true;
        this.selected.tieback.basePrice = initialTieback.price;
        console.log('Initial selected tieback:', this.selected.tieback);
      }
    }

    updateMemoryShapedVisibility() {
      if (!this.config.spsOrderWidth || !this.config.spsOrderLength || !this.memoryShaped?.displayRules) {
        if (this.memoryShaped) {
          this.memoryShaped.activeStatus = false;
          this.selected.memoryShaped = { data: null, activeStatus: false, basePrice: 0 };
          console.log('Reset selected.memoryShaped due to missing data or rules:', this.selected.memoryShaped);
        }
        this.updateTabVisibility();
        return;
      }
    
      const selectedWidth = this.config.spsOrderWidth.width;
      const selectedLength = this.config.spsOrderLength.Length;
      const displayRules = this.memoryShaped.displayRules;
    
      const shouldShow = displayRules.some(
        (rule) =>
          selectedWidth >= 1 && selectedWidth <= rule.width && selectedLength >= 1 && selectedLength <= rule.length
      );
    
      if (this.memoryShaped) {
        this.memoryShaped.activeStatus = shouldShow;
        if (!shouldShow) {
          this.selected.memoryShaped = { data: null, activeStatus: false, basePrice: 0 };
          console.log('Reset selected.memoryShaped due to display rules:', this.selected.memoryShaped);
        } else if (this.selected.memoryShaped.data) {
          // Update price: 0 for secondary item, otherwise use priceRules
          let basePrice = 0;
          if (this.selected.memoryShaped.data.title === this.memoryShaped.primaryTitle && this.config.spsOrderLength && this.memoryShaped?.priceRules) {
            const rule = this.memoryShaped.priceRules.find(
              (rule) => selectedLength >= rule.lengthMin && selectedLength <= rule.lengthMax
            );
            basePrice = rule ? rule.price || 0 : 0;
          }
          this.selected.memoryShaped.basePrice = basePrice;
          console.log('Updated selected.memoryShaped price:', this.selected.memoryShaped);
        }
      }
      this.updateTabVisibility();
    }

    memoryShapedUI() {
      if (!this.memoryShaped || !this.memoryShaped.activeStatus) {
        this.selected.memoryShaped = { data: null, activeStatus: false, basePrice: 0 };
        console.log('Reset selected.memoryShaped for hidden tab:', this.selected.memoryShaped);
        this.querySelector('.ccapp-bms-wrapper').innerHTML = '<div>Loading...</div>';
        return;
      }
      const memoryShaped = this.memoryShaped || {};
      const memoryShapedItems = [
        {
          image: memoryShaped?.primaryImage,
          title: memoryShaped?.primaryTitle,
          isActive: memoryShaped?.isTie ?? true,
        },
        {
          image: memoryShaped?.secondaryImage,
          title: memoryShaped?.secondaryTitle,
          isActive: memoryShaped?.isTie === false,
        },
      ];
    
      // Calculate initial price: 0 for secondary item, otherwise use priceRules
      let basePrice = 0;
      if ((memoryShaped?.isTie ?? true) && this.config.spsOrderLength && memoryShaped?.priceRules) {
        const selectedLength = this.config.spsOrderLength.Length;
        const rule = memoryShaped.priceRules.find(
          (rule) => selectedLength >= rule.lengthMin && selectedLength <= rule.lengthMax
        );
        basePrice = rule ? rule.price || 0 : 0;
      }
    
      let uiEL = '';
      memoryShapedItems.forEach((item, index) => {
        uiEL += `<div class="ccapp-memory-shaped-item ${item.isActive ? 'active' : ''}" data-index="${index}">
          <img class="ccapp-memory-shaped-image" src="${item.image || ''}" width="100">
          <p class="ccapp-memory-shaped-title">${item.title || ''}</p>
        </div>`;
      });
      const wrapper = this.querySelector('.ccapp-bms-wrapper');
      if (wrapper) {
        wrapper.innerHTML = uiEL;
      }
      if (memoryShapedItems.length > 0) {
        const initialMemoryShaped = memoryShapedItems.find(item => item.isActive) || memoryShapedItems[0];
        this.selected.memoryShaped.data = initialMemoryShaped;
        this.selected.memoryShaped.activeStatus = true;
        this.selected.memoryShaped.basePrice = basePrice;
        console.log('Initial selected memoryShaped:', this.selected.memoryShaped);
      }
    }

    roomLabelUI() {
      if (!this.roomLabel || !this.roomLabel.activeStatus) {
        this.selected.roomLabel = { data: null, activeStatus: false, basePrice: 0 };
        console.log('Reset selected.roomLabel for hidden tab:', this.selected.roomLabel);
        this.querySelector('.ccapp-rl-wrapper').innerHTML = '<div>Loading...</div>';
        return;
      }

      const roomLabel = this.roomLabel || null;
    
      const roomLabelOptions = roomLabel?.options || [];
      let optionsEl = '';
      roomLabelOptions?.map((option) => {
        optionsEl += `<option value="${option?.title}">${option?.title}</option>`;
      });
    
      let uiEL = `
        <div>
          <label for="room-label-select">Select Room</label>
          <select id="room-label-select">${optionsEl}</select>  
        </div>  
        <div>
          <label for="room-label-description">Window Description</label>
          <input type="text" id="room-label-description" placeholder="Window description" maxlength="${roomLabel?.descriptionMaxLength || 100}" />
        </div>  
      `;
    
      if (this.querySelector('.ccapp-rl-wrapper')) {
        this.querySelector('.ccapp-rl-wrapper').innerHTML = uiEL;
      }
    
      // Set initial room label data
      if (roomLabelOptions.length > 0) {
        this.selected.roomLabel.data = {
          room: roomLabelOptions[0].title,
          description: '',
        };
        this.selected.roomLabel.activeStatus = true;
        this.selected.roomLabel.basePrice = roomLabelOptions[0]?.price || 0;
        console.log('Initial selected room label:', this.selected);
      }
    
      // Add event listeners for updates
      const roomSelect = this.querySelector('#room-label-select');
      const descriptionInput = this.querySelector('#room-label-description');
      if (roomSelect) {
        roomSelect.addEventListener('change', (e) => {
          this.selected.roomLabel.data = {
            ...this.selected.roomLabel.data,
            room: e.target.value,
          };
          this.selected.roomLabel.activeStatus = true;
          console.log('Updated selected room label:', this.selected);
        });
      }
      if (descriptionInput) {
        descriptionInput.addEventListener('input', (e) => {
          this.selected.roomLabel.data = {
            ...this.selected.roomLabel.data,
            description: e.target.value,
          };
          this.selected.roomLabel.activeStatus = true;
          console.log('Updated selected room label description:', this.selected);
        });
      }
    }

    handleOrderTrackSizeClick(btn) {
      const size = btn.dataset.size;
      const price = btn.dataset.price;
      this.selectedTrackSize = size;
      this.selectedTrackPrice = price;
      this.querySelectorAll('.ccapp-ots-button').forEach((button) => {
        button.classList.remove('active');
        if (button.dataset.size === size) {
          button.classList.add('active');
        }
      });
      console.log('Selected Size:', size, 'Selected Price:', price);
      this.updateSelectedTrackSizeDisplay();
    }

    updateSelectedTrackSizeDisplay() {
      const header = this.querySelector('.ccapp-order-track-size-header');
      if (header && this.selectedTrackSize && this.selectedTrackPrice) {
        header.textContent = `Track Size: ${this.selectedTrackSize} (+$${this.selectedTrackPrice})`;
      } else {
        header.textContent = `Track Size: N/A (N/A)`;
      }
    }

    orderTrackSizeUI() {
      if (!this.trackSize || !this.trackSize.activeStatus) {
        this.selected.trackSize = { data: null, activeStatus: false, basePrice: 0 };
        console.log('Reset selected.trackSize for hidden tab:', this.selected.trackSize);
        this.querySelector('.ccapp-order-track-size-buttons').innerHTML = '<div>Loading...</div>';
        return;
      }

      const trackSize = this.trackSize || null;
    
      const trackSizeOptions = trackSize?.options || [];
    
      let buttonsHtml = '';
      trackSizeOptions.forEach((sizeData, index) => {
        buttonsHtml += `<button class="ccapp-ots-button ${index === 0 ? 'active' : ''}" data-size="${sizeData.title}" data-price="${sizeData.price}">
          ${sizeData.title}
        </button>`;
      });
    
      const buttonsContainer = this.querySelector('.ccapp-order-track-size-buttons');
      if (buttonsContainer) {
        buttonsContainer.innerHTML = buttonsHtml;
        this.selectedTrackSize = trackSizeOptions[0]?.title;
        this.selectedTrackPrice = trackSizeOptions[0]?.price;
        this.updateSelectedTrackSizeDisplay();
      }
    
      // Set initial track size data
      if (trackSizeOptions.length > 0) {
        this.selected.trackSize.data = {
          size: trackSizeOptions[0].title,
          price: trackSizeOptions[0].price || 0,
        };
        this.selected.trackSize.activeStatus = true;
        this.selected.trackSize.basePrice = trackSizeOptions[0].price || 0;
        console.log('Initial selected track size:', this.selected);
      }
    
      // Add event listener for updates
      const trackButtons = this.querySelectorAll('.ccapp-ots-button');
      if (trackButtons) {
        trackButtons.forEach(button => {
          button.addEventListener('click', (e) => {
            const selectedSize = e.target.dataset.size;
            const selectedPrice = e.target.dataset.price;
            this.selected.trackSize.data = {
              size: selectedSize,
              price: selectedPrice || 0,
            };
            this.selected.trackSize.activeStatus = true;
            this.selected.trackSize.basePrice = selectedPrice || 0;
            console.log('Updated selected track size:', this.selected);
            this.handleOrderTrackSizeClick(e.target); // Update UI state
          });
        });
      }
    }

    handlePanelTypeChange(e) {
      this.selectedPanelType = e.target.value;
      const positionSelect = this.querySelector('.ccapp-spp-position');
      const showDropdown = this.panelTypes?.find((t) => t.value === this.selectedPanelType)?.showPositionDropdown;
      if (positionSelect) {
        positionSelect.classList.toggle('hide', !showDropdown);
        const dropdownHeight = showDropdown ? 0 : positionSelect.scrollHeight;
        if (showDropdown) {
          const panelPositions = this.panelTypeData?.panelPosition || ['Left', 'Center', 'Right'];
          this.updatePositionDropdown(panelPositions);
          // Update panelPosition if it differs from the current dropdown value
          const positionDropdown = positionSelect.querySelector('select');
          if (positionDropdown && this.panelPosition !== positionDropdown.value) {
            this.panelPosition = positionDropdown.value;
            this.selected.panelType.data = {
              ...this.selected.panelType.data,
              position: this.panelPosition,
            };
            console.log('Synced panel position with dropdown:', this.selected);
          }
        }
        this.handleResizeHeightCollectionTab(this.querySelector('.ccapp-msc-tab.active'), dropdownHeight);
      }
    }

    updatePositionDropdown(panelPositions) {
      const positionSelect = this.querySelector('.ccapp-spp-position select');
      if (positionSelect && panelPositions.length > 0) {
        let optionsHtml = '';
        panelPositions.forEach((position) => {
          optionsHtml += `<option value="${position.toLowerCase().replace(' ', '-')}">${position}</option>`;
        });
        positionSelect.innerHTML = optionsHtml;
        if (!this.panelPosition) {
          this.panelPosition = panelPositions[0].toLowerCase().replace(' ', '-');
        }
        positionSelect.value = this.panelPosition;
      }
    }

    singlePanelOrPairUI() {
      if (!this.panelTypeData || !this.panelTypeData.activeStatus) {
        this.selected.panelType = { data: null, activeStatus: false, basePrice: 0 };
        console.log('Reset selected.panelType for hidden tab:', this.selected.panelType);
        if(this.querySelector('.ccapp-spp-options')){
            this.querySelector('.ccapp-spp-options').innerHTML = '<div>Loading...</div>';
        }
        return;
      }

      const panelPositions = this.panelTypeData?.panelPosition || ['Left', 'Center', 'Right'];
      this.panelTypes = [
        {
          value: 'single',
          label: this.panelTypeData?.singlePanelTitle || 'Single Panel',
          image: this.panelTypeData?.singleImage || '',
          showPositionDropdown: true,
        },
        {
          value: 'pair',
          label: this.panelTypeData?.pairPanelTitle || 'Pair Panel',
          image: this.panelTypeData?.pairImage || '',
          showPositionDropdown: false,
        },
      ];
      const panelTypeContainer = this.querySelector('.ccapp-spp-options');
      const positionSelect = this.querySelector('.ccapp-spp-position');
      if (panelTypeContainer && positionSelect && this.panelTypes.length > 0) {
        let radioHtml = '';
        this.panelTypes.forEach((type, index) => {
          radioHtml += `<label class="ccapp-spp-radio">
            <img src="${type.image || ''}" width="100" style="aspect-ratio: 1; object-fit: cover; margin-right: 5px;">
            <div class="ccapp-spp-radio--inner">
              <input type="radio" name="panel-type" value="${type.value}" ${index === 0 ? 'checked' : ''}>
              ${type.label || 'N/A'}
            </div>
          </label>`;
        });
        panelTypeContainer.innerHTML = radioHtml;
    
        let typeOptions = '';
        panelPositions.forEach((p) => {
          typeOptions += `<option value="${p.toLowerCase().replace(' ', '-')}">${p}</option>`;
        });
        positionSelect.querySelector('select').innerHTML = typeOptions;
    
        // Set initial panel type and position data
        if (this.panelTypes.length > 0 && panelPositions.length > 0) {
          this.selected.panelType.data = {
            type: this.panelTypes[0].value,
            label: this.panelTypes[0].label,
            position: this.panelTypes[0].showPositionDropdown ? panelPositions[0].toLowerCase().replace(' ', '-') : null,
            price: 0, // Adjust if price data is available
          };
          this.selected.panelType.activeStatus = true;
          this.selected.panelType.basePrice = 0; // Adjust if price data is available
          this.panelPosition = this.panelTypes[0].showPositionDropdown ? panelPositions[0].toLowerCase().replace(' ', '-') : null;
          if (this.panelPosition) {
            positionSelect.querySelector('select').value = this.panelPosition;
          }
          console.log('Initial selected panel type and position:', this.selected);
        }
    
        // Add event listener for panel type updates
        const panelTypeRadios = this.querySelectorAll('input[name="panel-type"]');
        panelTypeRadios.forEach((radio) => {
          radio.addEventListener('change', (e) => {
            const selectedType = this.panelTypes.find(t => t.value === e.target.value);
            this.selected.panelType.data = {
              ...this.selected.panelType.data,
              type: selectedType.value,
              label: selectedType.label,
              position: selectedType.showPositionDropdown ? this.panelPosition : null,
            };
            this.selected.panelType.activeStatus = true;
            this.selected.panelType.basePrice = 0; // Adjust if price data is available
            console.log('Updated selected panel type:', this.selected);
            this.handlePanelTypeChange(e); // Update UI state (e.g., position dropdown visibility)
          });
        });
    
        // Add event listener for position dropdown updates
        const positionDropdown = positionSelect.querySelector('select');
        if (positionDropdown) {
          positionDropdown.addEventListener('change', (e) => {
            if (this.selectedPanelType === 'single') { // Only update position if single panel is selected
              this.selected.panelType.data = {
                ...this.selected.panelType.data,
                position: e.target.value,
              };
              this.panelPosition = e.target.value;
              this.selected.panelType.activeStatus = true;
              console.log('Updated selected panel position:', this.selected);
            }
          });
        }
    
        panelTypeRadios.forEach((radio) => {
          if (radio.checked) {
            this.selectedPanelType = radio.value;
            const showDropdown = this.panelTypes.find((t) => t.value === this.selectedPanelType)?.showPositionDropdown;
            positionSelect.classList.toggle('hide', !showDropdown);
            if (showDropdown) {
              this.updatePositionDropdown(panelPositions);
            }
          }
        });
      } else {
        if(panelTypeContainer){
            panelTypeContainer.innerHTML = '<div>Loading...</div>';
        }
      }
    }

    liftTypeUI() {
      if (!this.liftType || !this.liftType.activeStatus) {
        this.selected.liftType = { data: null, activeStatus: false, basePrice: 0 };
        console.log('Reset selected.liftType for hidden tab:', this.selected.liftType);
        this.querySelector('.ccapp-lift-type-wrapper').innerHTML = '<div>Loading...</div>';
        return;
      }

      const liftType = this.liftType || {};
      const liftOptions = [
        {
          image: liftType.manualImage,
          title: liftType.manualPanelTitle || 'Manual Lift',
          isActive: true,
          price: liftType.manualPrice || 0,
        },
        {
          image: liftType.motorizedImage,
          title: liftType.motorizedPanelTitle || 'Motorized Lift',
          isActive: false,
          remoteControlTypes: liftType.remoteControlTypes || [],
        },
      ];
    
      let itemsHtml = '';
      let buttonsHtml = '';
      liftOptions.forEach((item, index) => {
        itemsHtml += `
          <div class="ccapp-lift-type-item ${item.isActive ? 'active' : ''}" data-index="${index}">
            <img class="ccapp-lift-type-image" src="${item.image}" />
            <p class="ccapp-lift-type-title">${item.title}</p>
          </div>
        `;
        if (item.remoteControlTypes) {
          item.remoteControlTypes.forEach((btn, btnIndex) => {
            buttonsHtml += `<button class="ccapp-lift-type-button ${
              btnIndex === 0 && index === 1 ? 'active' : ''
            }" data-index="${index}" data-btn-index="${btnIndex}">${btn.title}</button>`;
          });
        }
      });
    
      const wrapper = this.querySelector('.ccapp-lift-type-wrapper');
      if (wrapper) {
        wrapper.innerHTML = itemsHtml;
      }
      const btnsContainer = this.querySelector('.ccapp-lift-type-btns-container');
      if (btnsContainer) {
        btnsContainer.innerHTML = buttonsHtml;
        if (liftOptions[0].isActive && !liftOptions[0].remoteControlTypes) {
          btnsContainer.classList.add('hide');
        }
      }
    
      // Set initial lift type data
      if (liftOptions.length > 0) {
        this.selected.liftType.data = { ...liftOptions[0], index: 0 };
        this.selected.liftType.activeStatus = true;
        this.selected.liftType.basePrice = liftOptions[0].price;
        console.log('Initial selected lift type:', this.selected);
      }
    }

    handleLiftTypeItemSelector(btn) {
      const activeIndex = parseInt(btn.dataset?.index) || 0;
      const liftType = this.liftType || {};
      const liftOptions = [
        { title: liftType.manualPanelTitle, price: liftType.manualPrice || 0, image: liftType.manualImage, remoteControlTypes: null },
        { title: liftType.motorizedPanelTitle, price: liftType.remoteControlTypes?.[0]?.price || 0, image: liftType.motorizedImage, remoteControlTypes: liftType.remoteControlTypes },
      ];
      const items = this.querySelectorAll('.ccapp-lift-type-item');
      const btnsContainer = this.querySelector('.ccapp-lift-type-btns-container');
      items.forEach((item, index) => {
        if (index === activeIndex) {
          item.classList.add('active');
          this.selected.liftType.data = { ...liftOptions[index], index: activeIndex };
          this.selected.liftType.activeStatus = true;
          this.selected.liftType.basePrice = liftOptions[index].price; // Use first remote control price for Motorized
          console.log('Updated selected lift type:', this.selected);
          if (btnsContainer && liftOptions[index].remoteControlTypes) {
            btnsContainer.classList.remove('hide');
            this.querySelectorAll('.ccapp-lift-type-button').forEach((button) => {
              button.classList.remove('active');
              if (parseInt(button.dataset.index) === index && parseInt(button.dataset.btnIndex) === 0) {
                button.classList.add('active');
              }
            });
          } else if (btnsContainer) {
            btnsContainer.classList.add('hide');
          }
        } else {
          item.classList.remove('active');
        }
      });
      const activeTab = this.querySelector('.ccapp-msc-tab.active');
      if (activeTab) {
        this.handleResizeHeightCollectionTab(activeTab);
      }
    }

    handleLiftTypeButtonClick(btn) {
      const liftIndex = parseInt(btn.dataset.index);
      const btnIndex = parseInt(btn.dataset.btnIndex);
      this.querySelectorAll('.ccapp-lift-type-button').forEach((button) => {
        button.classList.remove('active');
        if (parseInt(button.dataset.index) === liftIndex && parseInt(button.dataset.btnIndex) === btnIndex) {
          button.classList.add('active');
        }
      });
      const liftType = this.liftType || {};
      const liftOptions = [
        { title: liftType.manualPanelTitle, price: liftType.manualPrice || 0, remoteControlTypes: null },
        { title: liftType.motorizedPanelTitle, price: liftType.remoteControlTypes?.[0]?.price || 0, remoteControlTypes: liftType.remoteControlTypes },
      ];
      const selectedRemoteControl = liftOptions[1].remoteControlTypes[btnIndex];
      if (this.selected.liftType.data.index === 1 && this.selected.liftType.data.remoteControl?.title !== selectedRemoteControl.title) {
        this.selected.liftType.data = { ...this.selected.liftType.data, remoteControl: selectedRemoteControl };
        this.selected.liftType.basePrice = selectedRemoteControl.price; // Update only if different
        console.log('Updated selected lift type with new remote control:', this.selected);
      }
    }

    trimUI() {
      console.log('trim===', this.trim);
      if (!this.trim || !this.trim.activeStatus) {
        this.selected.trim = { data: null, activeStatus: false, basePrice: 0 };
        console.log('Reset selected.trim for hidden tab:', this.selected.trim);
        this.querySelector('.ccapp-trim-wrapper').innerHTML = '<div>Loading...</div>';
        return;
      }
      
      let trimEl = '';
      this.trim?.swatches?.map((item, index) => {
        trimEl += `<div class="ccapp-trim-item" data-index="${index}">
          <img class="ccapp-trim-image" src="${item?.image64}" width="100">
          <p class="ccapp-trim-title">${item?.title} - $${item?.price || 0}</p>
        </div>`;
      });
      
      if (this.querySelector('.ccapp-trim-wrapper')) {
        this.querySelector('.ccapp-trim-wrapper').innerHTML = trimEl;
      }
      
      // Initialize with no trim selected
      this.selected.trim = { data: null, activeStatus: false, basePrice: 0 };
      console.log('Initial selected trim (none):', this.selected.trim);
      
      // Handle trim selection with unselect
      const trimWrapper = this.querySelector('.ccapp-trim-wrapper');
      if (trimWrapper) {
        trimWrapper.addEventListener('click', (e) => {
          const trimItem = e.target.closest('.ccapp-trim-item');
          if (trimItem) {
            const index = parseInt(trimItem.dataset.index);
            const isAlreadyActive = trimItem.classList.contains('active');
            this.querySelectorAll('.ccapp-trim-item').forEach((item) => item.classList.remove('active'));
            if (!isAlreadyActive) {
              trimItem.classList.add('active');
              const selectedTrimData = this.trim.swatches[index];
              this.selected.trim.data = {
                image64: selectedTrimData.image64,
                title: selectedTrimData.title,
                price: selectedTrimData.price || 0,
              };
              this.selected.trim.activeStatus = true;
              this.selected.trim.basePrice = selectedTrimData.price || 0;
              console.log('Updated selected trim on selection:', this.selected.trim);
              this.setTrimBackground(selectedTrimData.image64);
            } else {
              this.selected.trim = { data: null, activeStatus: false, basePrice: 0 };
              console.log('Trim deselected:', this.selected.trim);
              this.setTrimBackground('');
            }
            this.enforceTrimBorderExclusivity('trim');
          }
        });
      }
    }

    setTrimBackground(imageUrl) {
      const trimFill = this.querySelector('.trim-fill');
      if (trimFill) {
        trimFill.style.backgroundImage = `url("${imageUrl}")`;
      }
    }

    handleTrimItemSelector(btn) {
      const activeIndex = parseInt(btn.dataset?.index) || 0;
      const trimItem = btn.closest('.ccapp-trim-item');
      const isAlreadyActive = trimItem.classList.contains('active');
      this.querySelectorAll('.ccapp-trim-item').forEach((item, index) => {
        item.classList.remove('active');
      });
      if (!isAlreadyActive) {
        trimItem.classList.add('active');
        const selectedTrimData = this.trim.swatches[activeIndex];
        this.selected.trim.data = {
          image64: selectedTrimData.image64,
          title: selectedTrimData.title,
          price: selectedTrimData.price || 0,
        };
        this.selected.trim.activeStatus = true;
        this.selected.trim.basePrice = selectedTrimData.price || 0;
        this.setTrimBackground(selectedTrimData.image64);
        this.enforceTrimBorderExclusivity('trim');
        console.log('Updated selected trim:', this.selected);
      } else {
        this.selected.trim = { data: null, activeStatus: false, basePrice: 0 };
        console.log('Trim deselected:', this.selected);
        this.setTrimBackground('');
      }
    }

    enforceTrimBorderExclusivity(selectedType) {
      if (selectedType === 'trim' && this.selected.border.activeStatus) {
        this.querySelectorAll('.ccapp-border-swatch').forEach(s => s.classList.remove('active'));
        this.selected.border = {
          data: null,
          activeStatus: false,
          basePrice: 0,
        };
        this.setBorderBackground(''); // Clear border background
        const edgeSelect = this.querySelector('#edgeSelect');
        if (edgeSelect) {
          edgeSelect.innerHTML = `<option value="" disabled selected>Please select a border first</option>`;
          edgeSelect.setAttribute('disabled', 'disabled');
          this.querySelector('#edgeLabel').textContent = 'Select a border position:';
        }
        console.log('Border deselected due to trim selection:', this.selected);
      } else if (selectedType === 'border' && this.selected.trim.activeStatus) {
        this.querySelectorAll('.ccapp-trim-item').forEach(item => item.classList.remove('active'));
        this.selected.trim = {
          data: null,
          activeStatus: false,
          basePrice: 0,
        };
        this.setTrimBackground(''); // Clear trim background
        console.log('Trim deselected due to border selection:', this.selected);
      }
    }

    borderUI() {
      if (!this.border || !this.border.activeStatus) {
        this.selected.border = { data: null, activeStatus: false, basePrice: 0 };
        console.log('Reset selected.border for hidden tab:', this.selected.border);
        this.querySelector('#borderSwatchWrapper').innerHTML = '<div>Loading...</div>';
        return;
      }

      if (!this.border || !this.border.swatches || this.border.swatches.length === 0) {
        console.log('No border data available yet. Waiting for data...', this.border);
        return;
      }
    
      const swatchWrapper = this.querySelector('#borderSwatchWrapper');
      const edgeSelect = this.querySelector('#edgeSelect');
      const edgeLabel = this.querySelector('#edgeLabel');
      const borderFill = this.querySelector('.border-fill');
      const borderBottomFill = this.querySelector('.border-bottom-fill');
    
      if (!swatchWrapper || !edgeSelect || !edgeLabel || !borderFill || !borderBottomFill) {
        console.log('One or more DOM elements not found:', {
          swatchWrapper,
          edgeSelect,
          edgeLabel,
          borderFill,
          borderBottomFill
        });
        return;
      }
    
      // Populate swatches without initial selection
      let swatchHtml = '';
      this.border.swatches.forEach((swatch, index) => {
        swatchHtml += `
          <div class="ccapp-border-swatch" data-index="${index}">
            <img src="${swatch.image64}" class="ccapp-border-swatch-image" width="100">
            <p class="ccapp-border-swatch-title">${swatch.title}</p>
          </div>
        `;
      });
      swatchWrapper.innerHTML = swatchHtml;
    
      // Initialize with no border selected and pre-populate dropdown with placeholder
      this.selected.border = { data: null, activeStatus: false, basePrice: 0 };
      console.log('Initial selected border (none):', this.selected.border);
      edgeSelect.innerHTML = `<option value="" disabled selected>Please select a border first</option>`;
      edgeSelect.setAttribute('disabled', 'disabled');
      edgeLabel.textContent = 'Select a border position:';
      borderFill.style.display = 'none';
      borderBottomFill.style.display = 'none';
    
      // Remove any existing listeners to avoid duplicates
      swatchWrapper.replaceWith(swatchWrapper.cloneNode(true));
      const newSwatchWrapper = this.querySelector('#borderSwatchWrapper');
    
      // Handle swatch selection with unselect
      newSwatchWrapper.addEventListener('click', (e) => {
        console.log('Border swatch clicked:', e.target); // Debug log
        const swatch = e.target.closest('.ccapp-border-swatch');
        if (swatch) {
          const index = parseInt(swatch.dataset.index);
          const isAlreadyActive = swatch.classList.contains('active');
          newSwatchWrapper.querySelectorAll('.ccapp-border-swatch').forEach(s => s.classList.remove('active'));
          if (!isAlreadyActive) {
            swatch.classList.add('active');
            const selectedSwatch = this.border.swatches[index];
            const firstOption = edgeSelect.options[0]?.text.split(' - ')[0] || 'Bottom Edge';
            this.selected.border = {
              data: { ...selectedSwatch, title: `${selectedSwatch.title} - ${firstOption}` },
              activeStatus: true,
              basePrice: selectedSwatch.price.bottom,
            };
            console.log('Updated selected border on swatch change:', this.selected.border);
            edgeSelect.innerHTML = `
              <option value="${selectedSwatch.price.bottom}" selected>Bottom Edge - $${selectedSwatch.price.bottom}</option>
              <option value="${selectedSwatch.price.leadingEdge}">Leading Edge - $${selectedSwatch.price.leadingEdge}</option>
              <option value="${selectedSwatch.price.leadingEdgeBottom}">Leading Edge Bottom - $${selectedSwatch.price.leadingEdgeBottom}</option>
            `;
            edgeSelect.removeAttribute('disabled');
            edgeLabel.textContent = `Select a border position: ${this.selected.border.data.title}`;
            this.setBorderBackground(selectedSwatch.image64);
            this.enforceTrimBorderExclusivity('border');
            edgeSelect.dispatchEvent(new Event('change'));
          } else {
            swatch.classList.remove('active');
            this.selected.border = { data: null, activeStatus: false, basePrice: 0 };
            console.log('Border deselected:', this.selected.border);
            edgeSelect.innerHTML = `<option value="" disabled selected>Please select a border first</option>`;
            edgeSelect.setAttribute('disabled', 'disabled');
            edgeLabel.textContent = 'Select a border position:';
            borderFill.style.display = 'none';
            borderBottomFill.style.display = 'none';
            this.setBorderBackground('');
          }
        }
      });
    
      // Handle dropdown change
      edgeSelect.addEventListener('change', (e) => {
        if (this.selected.border.data) {
          const selectedValue = parseInt(e.target.value);
          const selectedEdge = e.target.options[e.target.selectedIndex].text.split(' - ')[0];
          const selectedSwatch = this.selected.border.data;
          this.selected.border = {
            data: { ...selectedSwatch, title: `${selectedSwatch.title.split(' - ')[0]} - ${selectedEdge}` },
            activeStatus: true,
            basePrice: selectedValue,
          };
          console.log('Updated selected border on dropdown change:', this.selected.border);
          edgeLabel.textContent = `Select a border position: ${this.selected.border.data.title}`;
          if (selectedEdge === 'Leading Edge') {
            borderFill.style.display = 'block';
            borderBottomFill.style.display = 'none';
          } else if (selectedEdge === 'Bottom Edge') {
            borderFill.style.display = 'none';
            borderBottomFill.style.display = 'block';
          } else if (selectedEdge === 'Leading Edge Bottom') {
            borderFill.style.display = 'block';
            borderBottomFill.style.display = 'block';
          }
          this.setBorderBackground(selectedSwatch.image64);
          this.enforceTrimBorderExclusivity('border');
        }
      });
    }

    setBorderBackground(imageUrl) {
      const borderFill = this.querySelector('.border-fill');
      const borderBottomFill = this.querySelector('.border-bottom-fill');
      if (borderFill) {
        borderFill.style.backgroundImage = `url("${imageUrl}")`;
      }
      if (borderBottomFill) {
        borderBottomFill.style.backgroundImage = `url("${imageUrl}")`;
      }
    }

    updateTabVisibility() {
      const tabs = [
        { key: 'panelSize', index: '2' },
        { key: 'liningType', index: '3' },
        { key: 'tieback', index: '4' },
        { key: 'memoryShaped', index: '5' },
        { key: 'roomLabel', index: '6' },
        { key: 'trackSize', index: '7' },
        { key: 'panelTypeData', index: '8' },
        { key: 'liftType', index: '9' },
        { key: 'trim', index: '10' },
        { key: 'border', index: '11' },
      ];
    
      tabs.forEach(({ key, index }) => {
        const tab = this.querySelector(`.ccapp-msc-tab[data-index="${index}"]`);
        if (tab) {
          const isVisible = this[key] && this[key].activeStatus;
          tab.style.display = isVisible ? 'block' : 'none';
          if (!isVisible) {
            const selectedKey = key === 'panelTypeData' ? 'panelType' : key; // Map panelTypeData to panelType
            this.selected[selectedKey] = { data: null, activeStatus: false, basePrice: 0 };
            console.log(`Reset selected.${selectedKey} for hidden tab:`, this.selected[selectedKey]);
          }
        }
      });
    
      // Ensure collections tab is always visible
      const collectionsTab = this.querySelector('.ccapp-msc-tab[data-index="1"]');
      if (collectionsTab) {
        collectionsTab.style.display = 'block';
      }
    }

    handleResizeHeightCollectionTab(tab = null, dropdownAdjustment = 0) {
      if (tab && tab.classList.contains('active')) {
        const content = tab.querySelector('.ccapp-msc-tab-content');
        if (content) {
          content.style.height = `auto`;
          const naturalHeight = content.scrollHeight;
          content.style.height = `${naturalHeight - dropdownAdjustment}px`;
        }
      }
    }

    stepOrders (data){
      const steps = data?.customizer?.stepOrders || [];
      let ui = "";
      steps.forEach(step=>{
       switch(step.id){
        case 'collections': 
            ui += `
        <div class="ccapp-msc-tab" data-index="1">
          <div class="ccapp-msc-tab-heading">
            <h3 class="ccapp-collection-heading">Choose Collection</h3>
            <svg
              class="mcct-icon-svg"
              width="20px"
              height="20px"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M10 14a.997.997 0 01-.707-.293l-5-5a.999.999 0 111.414-1.414L10 11.586l4.293-4.293a.999.999 0 111.414 1.414l-5 5A.997.997 0 0110 14z" fill="#5C5F62"></path>
            </svg>
          </div>
          <div class="ccapp-msc-tab-content">
            <div class="ccapp-collection-container">
              <div class="ccapp-collections-wrapper">Loading...</div>
            </div>
            <div class="ccapp-swatch-container">
              <div class="ccapp-sc-heading">
                <h3>Choose Color</h3>
              </div>
              <div class="ccapp-swatch-wrapper"></div>
            </div>
          </div>
        </div>
            `
          break;
        case 'palenSize': 
          ui += `
        <div class="ccapp-msc-tab" data-index="2">
          <div class="ccapp-msc-tab-heading">
            <div class="ccapp-osps-header">
              <h3 class="ccapp-osps-htitle">Order Single Panel Size</h3>
              <button class="ccapp-ospshti-btn ccapp-osps-modal-opener" data-type="length">
                <svg
                  fill="#000000"
                  width="20px"
                  height="20px"
                  viewBox="-1 0 19 19"
                  xmlns="http://www.w3.org/2000/svg"
                  class="cf-icon-svg"
                >
                  <path d="M16.417 9.583A7.917 7.917 0 1 1 8.5 1.666a7.917 7.917 0 0 1 7.917 7.917zM5.85 3.309a6.833 6.833 0 1 0 2.65-.534 6.787 6.787 0 0 0-2.65.534zm2.654 1.336A1.136 1.136 0 1 1 7.37 5.78a1.136 1.136 0 0 1 1.135-1.136zm.792 9.223V8.665a.792.792 0 1 0-1.583 0v5.203a.792.792 0 0 0 1.583 0z"/>
                </svg>
              </button>
            </div>
            <svg
              class="mcct-icon-svg"
              width="20px"
              height="20px"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M10 14a.997.997 0 01-.707-.293l-5-5a.999.999 0 111.414-1.414L10 11.586l4.293-4.293a.999.999 0 111.414 1.414l-5 5A.997.997 0 0110 14z" fill="#5C5F62"></path>
            </svg>
          </div>
          <div class="ccapp-msc-tab-content">
            <div class="ccapp-single-panel-size-container">
              <div class="ccapp-sps-wrapper">
                <div class="ccapp-sps-diagram">
                  <div>Loading...</div>
                </div>
                <div class="ccapp-sps-sizes-wrapper"></div>
              </div>
            </div>
          </div>
        </div>
          `
          break;
        case 'panelType': 
        ui += `
        <div class="ccapp-msc-tab" data-index="8">
          <div class="ccapp-msc-tab-heading">
            <div class="ccapp-osps-header">
              <h3 class="ccapp-osps-htitle">Single Panel or Pair</h3>
              <button class="ccapp-pt-btn ccapp-pt-modal-opener" data-type="panel-type">
                <svg
                  fill="#000000"
                  width="20px"
                  height="20px"
                  viewBox="-1 0 19 19"
                  xmlns="http://www.w3.org/2000/svg"
                  class="cf-icon-svg"
                >
                  <path d="M16.417 9.583A7.917 7.917 0 1 1 8.5 1.666a7.917 7.917 0 0 1 7.917 7.917zM5.85 3.309a6.833 6.833 0 1 0 2.65-.534 6.787 6.787 0 0 0-2.65.534zm2.654 1.336A1.136 1.136 0 1 1 7.37 5.78a1.136 1.136 0 0 1 1.135-1.136zm.792 9.223V8.665a.792.792 0 1 0-1.583 0v5.203a.792.792 0 0 0 1.583 0z"/>
                </svg>
              </button>
            </div>
            <svg
              class="mcct-icon-svg"
              width="20px"
              height="20px"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M10 14a.997.997 0 01-.707-.293l-5-5a.999.999 0 111.414-1.414L10 11.586l4.293-4.293a.999.999 0 111.414 1.414l-5 5A.997.997 0 0110 14z" fill="#5C5F62"></path>
            </svg>
          </div>
          <div class="ccapp-msc-tab-content">
            <div class="ccapp-single-panel-pair-container">
              <div class="ccapp-spp-options">Loading...</div>
              <div class="ccapp-spp-position">
                <div class="ccapp-spp-input-wrapper">
                  <label>Position:</label>
                  <select class="ccapp-spp-select" name="panel-position"></select>
                </div>
              </div>
            </div>
          </div>
        </div>        
        `
          break;
        case 'liningType': 
        ui += `
        <div class="ccapp-msc-tab" data-index="3">
          <div class="ccapp-msc-tab-heading">
            <div class="ccapp-osps-header">
              <h3 class="ccapp-osps-htitle">Select Lining Type</h3>

              <button class="ccapp-lthti-btn ccapp-lt-modal-opener" data-type="lift-type">
                <svg
                  fill="#000000"
                  width="20px"
                  height="20px"
                  viewBox="-1 0 19 19"
                  xmlns="http://www.w3.org/2000/svg"
                  class="cf-icon-svg"
                >
                  <path d="M16.417 9.583A7.917 7.917 0 1 1 8.5 1.666a7.917 7.917 0 0 1 7.917 7.917zM5.85 3.309a6.833 6.833 0 1 0 2.65-.534 6.787 6.787 0 0 0-2.65.534zm2.654 1.336A1.136 1.136 0 1 1 7.37 5.78a1.136 1.136 0 0 1 1.135-1.136zm.792 9.223V8.665a.792.792 0 1 0-1.583 0v5.203a.792.792 0 0 0 1.583 0z"/>
                </svg>
              </button>
            </div>
            <svg
              class="mcct-icon-svg"
              width="20px"
              height="20px"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M10 14a.997.997 0 01-.707-.293l-5-5a.999.999 0 111.414-1.414L10 11.586l4.293-4.293a.999.999 0 111.414 1.414l-5 5A.997.997 0 0110 14z" fill="#5C5F62"></path>
            </svg>
          </div>
          <div class="ccapp-msc-tab-content">
            <div class="ccapp-lining-type-container">
              <div class="ccapp-lining-type-wrapper">
                <div class="ccapp-lining-type-item">Loading...</div>
              </div>
            </div>
          </div>
        </div>
        `
          break;
        case 'tieback': 
            ui += `
        <div class="ccapp-msc-tab" data-index="4">
          <div class="ccapp-msc-tab-heading">
            <div class="ccapp-osps-header">
              <h3 class="ccapp-osps-htitle">Select Tieback</h3>
            </div>
            <svg
              class="mcct-icon-svg"
              width="20px"
              height="20px"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M10 14a.997.997 0 01-.707-.293l-5-5a.999.999 0 111.414-1.414L10 11.586l4.293-4.293a.999.999 0 111.414 1.414l-5 5A.997.997 0 0110 14z" fill="#5C5F62"></path>
            </svg>
          </div>
          <div class="ccapp-msc-tab-content">
            <div class="ccapp-tieback-container">
              <div class="ccapp-tieback-wrapper">
                <div class="ccapp-tieback-item">Loading...</div>
              </div>
            </div>
          </div>
        </div>
            `
          break;
        case 'memoryShaped': 
        ui += `
        <div class="ccapp-msc-tab" data-index="5">
          <div class="ccapp-msc-tab-heading">
            <div class="ccapp-osps-header">
              <h3 class="ccapp-osps-htitle">Body Memory Shaped</h3>
            </div>
            <svg
              class="mcct-icon-svg"
              width="20px"
              height="20px"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M10 14a.997.997 0 01-.707-.293l-5-5a.999.999 0 111.414-1.414L10 11.586l4.293-4.293a.999.999 0 111.414 1.414l-5 5A.997.997 0 0110 14z" fill="#5C5F62"></path>
            </svg>
          </div>
          <div class="ccapp-msc-tab-content">
            <div class="ccapp-bms-container">
              <div class="ccapp-bms-wrapper">
                <div class="ccapp-bms-item">Loading...</div>
              </div>
            </div>
          </div>
        </div>   
        `
          break;
        case 'roomLabel': 
        ui += `
         <div class="ccapp-msc-tab" data-index="6">
          <div class="ccapp-msc-tab-heading">
            <div class="ccapp-osps-header">
              <h3 class="ccapp-osps-htitle">Room Label</h3>
            </div>
            <svg
              class="mcct-icon-svg"
              width="20px"
              height="20px"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M10 14a.997.997 0 01-.707-.293l-5-5a.999.999 0 111.414-1.414L10 11.586l4.293-4.293a.999.999 0 111.414 1.414l-5 5A.997.997 0 0110 14z" fill="#5C5F62"></path>
            </svg>
          </div>
          <div class="ccapp-msc-tab-content">
            <div class="ccapp-rl-container">
              <div class="ccapp-rl-wrapper">
                <div class="ccapp-rl-item">Loading...</div>
              </div>
            </div>
          </div>
        </div>       
        `
          break;
        case 'trackSize': 
        ui += `
        <div class="ccapp-msc-tab" data-index="7">
          <div class="ccapp-msc-tab-heading">
            <div class="ccapp-osps-header">
              <h3 class="ccapp-osps-htitle">Order Track Size</h3>
              <button class="ccapp-ots-btn ccapp-ots-modal-opener" data-type="track-size">
                <svg
                  fill="#000000"
                  width="20px"
                  height="20px"
                  viewBox="-1 0 19 19"
                  xmlns="http://www.w3.org/2000/svg"
                  class="cf-icon-svg"
                >
                  <path d="M16.417 9.583A7.917 7.917 0 1 1 8.5 1.666a7.917 7.917 0 0 1 7.917 7.917zM5.85 3.309a6.833 6.833 0 1 0 2.65-.534 6.787 6.787 0 0 0-2.65.534zm2.654 1.336A1.136 1.136 0 1 1 7.37 5.78a1.136 1.136 0 0 1 1.135-1.136zm.792 9.223V8.665a.792.792 0 1 0-1.583 0v5.203a.792.792 0 0 0 1.583 0z"/>
                </svg>
              </button>
            </div>
            <svg
              class="mcct-icon-svg"
              width="20px"
              height="20px"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M10 14a.997.997 0 01-.707-.293l-5-5a.999.999 0 111.414-1.414L10 11.586l4.293-4.293a.999.999 0 111.414 1.414l-5 5A.997.997 0 0110 14z" fill="#5C5F62"></path>
            </svg>
          </div>
          <div class="ccapp-msc-tab-content">
            <div class="ccapp-order-track-size-container">
              <div class="ccapp-order-track-size-header">Selected: N/A (N/A)</div>
              <div class="ccapp-order-track-size-buttons">Loading...</div>
            </div>
          </div>
        </div>   
        `
          break;
        case 'liftType': 
        ui += `
        <div class="ccapp-msc-tab" data-index="9">
          <div class="ccapp-msc-tab-heading">
            <div class="ccapp-osps-header">
              <h3 class="ccapp-osps-htitle">Select Lift Type</h3>
              <button class="ccapp-lt-btn ccapp-lift-modal-opener" data-type="panel-type">
                <svg
                  fill="#000000"
                  width="20px"
                  height="20px"
                  viewBox="-1 0 19 19"
                  xmlns="http://www.w3.org/2000/svg"
                  class="cf-icon-svg"
                >
                  <path d="M16.417 9.583A7.917 7.917 0 1 1 8.5 1.666a7.917 7.917 0 0 1 7.917 7.917zM5.85 3.309a6.833 6.833 0 1 0 2.65-.534 6.787 6.787 0 0 0-2.65.534zm2.654 1.336A1.136 1.136 0 1 1 7.37 5.78a1.136 1.136 0 0 1 1.135-1.136zm.792 9.223V8.665a.792.792 0 1 0-1.583 0v5.203a.792.792 0 0 0 1.583 0z"></path>
                </svg>
              </button>
            </div>
            <svg
              class="mcct-icon-svg"
              width="20px"
              height="20px"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M10 14a.997.997 0 01-.707-.293l-5-5a.999.999 0 111.414-1.414L10 11.586l4.293-4.293a.999.999 0 111.414 1.414l-5 5A.997.997 0 0110 14z" fill="#5C5F62"></path>
            </svg>
          </div>
          <div class="ccapp-msc-tab-content">
            <div class="ccapp-lift-type-container">
              <div class="ccapp-lift-type-wrapper">
                <div class="ccapp-lift-type-item">Loading...</div>
              </div>
              <div class="ccapp-lift-type-btns-container"></div>
            </div>
          </div>
        </div>   
        `
          break;
        case 'trims': 
        ui += `
        <div class="ccapp-msc-tab" data-index="10">
          <div class="ccapp-msc-tab-heading">
            <div class="ccapp-osps-header">
              <h3 class="ccapp-osps-htitle">Select Trim</h3>
              <button class="ccapp-trim-modal ccapp-trim-modal-opener" data-type="trim">
                <svg
                  fill="#000000"
                  width="20px"
                  height="20px"
                  viewBox="-1 0 19 19"
                  xmlns="http://www.w3.org/2000/svg"
                  class="cf-icon-svg"
                >
                  <path d="M16.417 9.583A7.917 7.917 0 1 1 8.5 1.666a7.917 7.917 0 0 1 7.917 7.917zM5.85 3.309a6.833 6.833 0 1 0 2.65-.534 6.787 6.787 0 0 0-2.65.534zm2.654 1.336A1.136 1.136 0 1 1 7.37 5.78a1.136 1.136 0 0 1 1.135-1.136zm.792 9.223V8.665a.792.792 0 1 0-1.583 0v5.203a.792.792 0 0 0 1.583 0z"/>
                </svg>
              </button>
            </div>
            <svg
              class="mcct-icon-svg"
              width="20px"
              height="20px"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M10 14a.997.997 0 01-.707-.293l-5-5a.999.999 0 111.414-1.414L10 11.586l4.293-4.293a.999.999 0 111.414 1.414l-5 5A.997.997 0 0110 14z" fill="#5C5F62"></path>
            </svg>
          </div>
          <div class="ccapp-msc-tab-content">
            <div class="ccapp-trim-container">
              <div class="ccapp-trim-wrapper">
                <div class="ccapp-trim-item">Loading...</div>
              </div>
            </div>
          </div>
        </div>
        `
          break;
        case 'border': 
        ui += `
        <div class="ccapp-msc-tab" data-index="11">
          <div class="ccapp-msc-tab-heading">
            <div class="ccapp-osps-header">
              <h3 class="ccapp-osps-htitle">Border Selection</h3>
              <button class="ccapp-border-modal ccapp-border-modal-opener" data-type="border">
                <svg
                  fill="#000000"
                  width="20px"
                  height="20px"
                  viewBox="-1 0 19 19"
                  xmlns="http://www.w3.org/2000/svg"
                  class="cf-icon-svg"
                >
                  <path d="M16.417 9.583A7.917 7.917 0 1 1 8.5 1.666a7.917 7.917 0 0 1 7.917 7.917zM5.85 3.309a6.833 6.833 0 1 0 2.65-.534 6.787 6.787 0 0 0-2.65.534zm2.654 1.336A1.136 1.136 0 1 1 7.37 5.78a1.136 1.136 0 0 1 1.135-1.136zm.792 9.223V8.665a.792.792 0 1 0-1.583 0v5.203a.792.792 0 0 0 1.583 0z"/>
                </svg>
              </button>
            </div>
            <svg class="mcct-icon-svg" width="20px" height="20px" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 14a.997.997 0 01-.707-.293l-5-5a.999.999 0 111.414-1.414L10 11.586l4.293-4.293a.999.999 0 111.414 1.414l-5 5A.997.997 0 0110 14z" fill="#5C5F62"></path>
            </svg>
          </div>
          <div class="ccapp-msc-tab-content">
            <div class="ccapp-border-ui">
              <div class="ccapp-border-swatch-wrapper" id="borderSwatchWrapper"></div>
              <div class="ccapp-border-dropdowns">
                <div class="ccapp-border-dropdown">
                  <label id="edgeLabel">Select a border position:</label>
                  <select class="ccapp-border-select" id="edgeSelect"></select>
                </div>
              </div>
            </div>
          </div>
        </div>
        `
          break;
        default:
      }
      })
      const allUi = this.querySelector('.ccapp-info');
      if(allUi){
        allUi.innerHTML = ui;
      }
    }

    async getData(customizerId = 1) {
      try {
        let response = await fetch(`${this.appUrl}/api/curtain/${customizerId}`);
        if (!response.ok) throw new Error(`Failed to fetch curtain data: ${response.status}`);
        let data = await response.json();
        console.log('data==', data);
        this.data.collections = data?.collections || [];
        this.data.appUrl = data?.appUrl || '';
        this.collections = data?.collections || [];
        this.stepOrders(data);
        return true;
      } catch (error) {
        console.error('Error fetching curtain data:', error);
        return false;
      }
    }

    async loadOthersModules(customizerId = 1) {
      try {
        let response = await fetch(`${this.appUrl}/api/others-module/${customizerId}`);
        if (!response.ok) throw new Error(`Failed to fetch others module: ${response.status}`);
        let data = await response.json();
        console.log('others module data==', data);

        this.otherModuleLoaded = true;

        this.panelSize = data?.panelSize || null;
        this.liningType = data?.liningType || null;
        this.tieback = data?.tieback || null;
        this.memoryShaped = data?.memoryShaped || null;
        this.roomLabel = data?.roomLabel || null;
        this.trackSize = data?.trackSize || null;
        this.panelTypeData = data?.panelType || null;
        this.trim = data?.trim || null;
        this.liftType = data?.liftType || null;
        this.border = data?.border || null;

        this.singlePanelSizeUI();
        this.liningTypeUI();
        this.tiebackUI();
        this.memoryShapedUI();
        this.roomLabelUI();
        this.orderTrackSizeUI();
        this.singlePanelOrPairUI();
        this.liftTypeUI();
        this.trimUI();
        this.borderUI();
        this.updateTabVisibility(); // Update visibility after loading data
      } catch (error) {
        console.error('Error loading others modules:==========', error);
        this.panelTypeData = null;
        this.trip = null;
        this.singlePanelSizeUI();
        this.liningTypeUI();
        this.tiebackUI();
        this.memoryShapedUI();
        this.roomLabelUI();
        this.orderTrackSizeUI();
        this.singlePanelOrPairUI();
        this.liftTypeUI();
        this.trimUI();
        this.borderUI();
        this.updateTabVisibility(); // Update visibility even on error
      }
    }
  }

  customElements.define('curtain-customizer-app', CurtainCustomizer);
