
import {fileToStringConverter} from "./fileToStringConverter.js"


    
export function fileLoader(containerId, fileObtainedCallback, errorCallback, maxFileSize = 5242880, supportedFileTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'image/tiff']) {
  try {
    const fileToStringConverterResult = fileToStringConverter();
    const convertFileToString = fileToStringConverterResult.convertFileToString;
    const restoreFileFromString = fileToStringConverterResult.restoreFileFromString;

    const container = document.getElementById(containerId);
    if (!container) {
      return 'Container not found';
    }

    const button = document.createElement('input');
    button.type = 'file';
    button.accept = supportedFileTypes.join(',');
    container.appendChild(button);

    button.addEventListener('change', (event) => {
      const file = event.target.files[0];
      if (!file) {
        errorCallback('No file selected');
        return;
      }

      if (file.size > maxFileSize) {
        errorCallback('File size exceeds the maximum allowed limit');
        return;
      }

      if (!supportedFileTypes.includes(file.type)) {
        errorCallback('File type is not supported');
        return;
      }

      convertFileToString(file).then((base64String) => {
        fileObtainedCallback(base64String);
      }).catch((error) => {
        errorCallback(error);
      });
    });

    return '';
  } catch (error) {
    return 'An error occurred during initialization';
  }
}
    

