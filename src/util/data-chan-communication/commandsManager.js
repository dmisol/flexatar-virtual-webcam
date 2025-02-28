


    
export function commandsManager(
  onFlexatarPreview,
  onFlexatarCreated,
  onSetFlexatarToSlot,
  onDeleteFlexatar,
  onFlexatarRemoved,
  onSetEffect,
  onSetEffectAmount,
  onFlexatarActivated,
  onFlexatarEmotionList,
  onSetFlexatarEmotion,
  onSetBackground,
  onCreateFlexatar,
  onReloadFlexatarList
) {
  try {
    return {
      processMessage: function(message) {
        try {
          const json = JSON.parse(message);
          if (json.messageType === 'flexatarPreview') {
            onFlexatarPreview({ id: json.payload.id, previewImage: json.payload.previewImage });
          } else if (json.messageType === 'flexatarCreated') {
            onFlexatarCreated({ id: json.payload.id, previewImage: json.payload.previewImage }, json.payload.error);
          } else if (json.messageType === 'setFlexatarToSlot') {
            onSetFlexatarToSlot(json.payload.id, json.payload.slotNumber);
          } else if (json.messageType === 'deleteFlexatar') {
            onDeleteFlexatar(json.payload.id);
          } else if (json.messageType === 'flexatarRemoved') {
            onFlexatarRemoved(json.payload.id);
          } else if (json.messageType === 'setEffect') {
            onSetEffect(json.payload.effectId);
          } else if (json.messageType === 'setEffectAmount') {
            onSetEffectAmount(json.payload.amount);
          } else if (json.messageType === 'flexatarActivated') {
            onFlexatarActivated(json.payload.id, json.payload.slotIdx);
          } else if (json.messageType === 'flexatarEmotionList') {
            onFlexatarEmotionList(json.payload.emotionList);
          } else if (json.messageType === 'setFlexatarEmotion') {
            onSetFlexatarEmotion(json.payload.emotionId);
          } else if (json.messageType === 'setBackground') {
            onSetBackground(json.payload.base64Image);
          } else if (json.messageType === 'createFlexatar') {
            onCreateFlexatar(json.payload.base64Image);
          } else if (json.messageType === 'reloadFlexatarList') {
            onReloadFlexatarList();
          }
        } catch (e) {
          return {
            processMessage: function() {},
            makeFlexatarPreviewMessage: function() { return ''; },
            makeFlexatarCreatedMessage: function() { return ''; },
            makeSetFlexatarToSlotMessage: function() { return ''; },
            makeDeleteFlexatarMessage: function() { return ''; },
            makeFlexatarRemovedMessage: function() { return ''; },
            makeSetEffectMessage: function() { return ''; },
            makeSetEffectAmountMessage: function() { return ''; },
            makeFlexatarActivatedMessage: function() { return ''; },
            makeFlexatarEmotionListMessage: function() { return ''; },
            makeSetFlexatarEmotionMessage: function() { return ''; },
            makeSetBackgroundMessage: function() { return ''; },
            makeCreateFlexatarMessage: function() { return ''; },
            makeReloadFlexatarListMessage: function() { return ''; }
          };
        }
      },
      makeFlexatarPreviewMessage: function(flexatarItem) {
        return JSON.stringify({ messageType: 'flexatarPreview', payload: flexatarItem });
      },
      makeFlexatarCreatedMessage: function(flexatarItem, error) {
        return JSON.stringify({ messageType: 'flexatarCreated', payload: { id: flexatarItem.id, previewImage: flexatarItem.previewImage, error: error } });
      },
      makeSetFlexatarToSlotMessage: function(id, slotNumber) {
        return JSON.stringify({ messageType: 'setFlexatarToSlot', payload: { id: id, slotNumber: slotNumber } });
      },
      makeDeleteFlexatarMessage: function(id) {
        return JSON.stringify({ messageType: 'deleteFlexatar', payload: { id: id } });
      },
      makeFlexatarRemovedMessage: function(id) {
        return JSON.stringify({ messageType: 'flexatarRemoved', payload: { id: id } });
      },
      makeSetEffectMessage: function(effectId) {
        return JSON.stringify({ messageType: 'setEffect', payload: { effectId: effectId } });
      },
      makeSetEffectAmountMessage: function(amount) {
        return JSON.stringify({ messageType: 'setEffectAmount', payload: { amount: amount } });
      },
      makeFlexatarActivatedMessage: function(id, slotIdx) {
        return JSON.stringify({ messageType: 'flexatarActivated', payload: { id: id, slotIdx: slotIdx } });
      },
      makeFlexatarEmotionListMessage: function(emotionList) {
        return JSON.stringify({ messageType: 'flexatarEmotionList', payload: { emotionList: emotionList } });
      },
      makeSetFlexatarEmotionMessage: function(emotionId) {
        return JSON.stringify({ messageType: 'setFlexatarEmotion', payload: { emotionId: emotionId } });
      },
      makeSetBackgroundMessage: function(base64Image) {
        return JSON.stringify({ messageType: 'setBackground', payload: { base64Image: base64Image } });
      },
      makeCreateFlexatarMessage: function(base64Image) {
        return JSON.stringify({ messageType: 'createFlexatar', payload: { base64Image: base64Image } });
      },
      makeReloadFlexatarListMessage: function() {
        return JSON.stringify({ messageType: 'reloadFlexatarList', payload: {} });
      }
    };
  } catch (e) {
    return {
      processMessage: function() {},
      makeFlexatarPreviewMessage: function() { return ''; },
      makeFlexatarCreatedMessage: function() { return ''; },
      makeSetFlexatarToSlotMessage: function() { return ''; },
      makeDeleteFlexatarMessage: function() { return ''; },
      makeFlexatarRemovedMessage: function() { return ''; },
      makeSetEffectMessage: function() { return ''; },
      makeSetEffectAmountMessage: function() { return ''; },
      makeFlexatarActivatedMessage: function() { return ''; },
      makeFlexatarEmotionListMessage: function() { return ''; },
      makeSetFlexatarEmotionMessage: function() { return ''; },
      makeSetBackgroundMessage: function() { return ''; },
      makeCreateFlexatarMessage: function() { return ''; },
      makeReloadFlexatarListMessage: function() { return ''; }
    };
  }
}
    

