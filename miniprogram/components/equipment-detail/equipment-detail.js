Component({
  properties: {
    visible: {
      type: Boolean,
      value: false,
    },
    item: {
      type: Object,
      value: null,
    },
  },

  methods: {
    close() {
      this.triggerEvent('close');
    },

    preventClose() {},

    onFavoriteTap() {
      const item = this.properties.item;
      if (!item || !item.id) {
        return;
      }
      this.triggerEvent('favorite', { itemId: item.id });
    },
  },
});
