


    

export function fileToStringConverter() {
  return {
    convertFileToString: (file) => {
      try {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      } catch (error) {
        console.error('Error converting file to string:', error);
        return '';
      }
    },
    restoreFileFromString: (base64String) => {
      try {
        const byteCharacters = atob(base64String.split(',')[1]);
        const byteArrays = new Uint8Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteArrays[i] = byteCharacters.charCodeAt(i);
        }
        return new File([byteArrays], 'file', { type: base64String.split(',')[0].split(':')[1].split(';')[0] });
      } catch (error) {
        console.error('Error restoring file from string:', error);
        return null;
      }
    }
  };
}

    

