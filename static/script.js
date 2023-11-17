function toggleLoadingMessage(show) {
  const loadingMessage = document.getElementById('loadingMessage');
  loadingMessage.style.display = show ? 'block' : 'none';
}

function resetUI() {
  const fileInput = document.getElementById('fileInput');
  const formatSelector = document.getElementById('outputFormat');
  const fileNameDisplay = document.getElementById('fileName');
  const uploadButton = document.getElementById('uploadButton');
  const loadingMessage = document.getElementById('loadingMessage');
  const timeoutMessage = document.getElementById('timeoutMessage');
  const loadingProgress = document.getElementById('loadingProgress');
  const downloadLink = document.getElementById('downloadLink');

  fileInput.value = null;
  formatSelector.value = 'eml';
  formatSelector.setAttribute('disabled', true);
  fileNameDisplay.innerHTML = '';
  uploadButton.disabled = true;
  loadingMessage.style.display = 'none';
  timeoutMessage.style.display = 'none';
  loadingProgress.style.display = 'none';
  downloadLink.style.display = 'none';
}

document.getElementById('fileInput').addEventListener('change', function () {
  const formatSelector = document.getElementById('outputFormat');
  const file = this.files[0];
  const fileNameDisplay = document.getElementById('fileName');
  const uploadButton = document.getElementById('uploadButton');

  if (file) {
    fileNameDisplay.innerHTML = 'File selezionato: ' + file.name;
    uploadButton.disabled = false;

    formatSelector.removeAttribute('disabled');
    formatSelector.options[0].disabled = !file.name.endsWith('.msg');
    formatSelector.options[1].disabled = !file.name.endsWith('.pdf');
    // formatSelector.options[2].disabled = !file.name.endsWith('.pdf');

    if (file.name.endsWith('.msg')) {
      formatSelector.value = 'eml'
    } 

    if (file.name.endsWith('.pdf')) {
      formatSelector.value = 'docx'
    }

  } else {
    formatSelector.value = '';
    formatSelector.setAttribute('disabled', true);

    fileNameDisplay.innerHTML = '';
    uploadButton.disabled = true;
  }


});

document.getElementById('downloadLink').addEventListener('click', function () {
  // Chiamare resetUI() dopo che l'utente ha cliccato per scaricare il file elaborato
  resetUI();
});

document.getElementById('uploadButton').addEventListener('click', async function () {
  const input = document.getElementById('fileInput');
  const file = input.files[0];

  if (file) {
    const formatSelector = document.getElementById('outputFormat');
    const selectedFormat = formatSelector.options[formatSelector.selectedIndex].value;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('outputFormat', selectedFormat);

    try {
      toggleLoadingMessage(true); // Mostra il messaggio di caricamento

      const response = await Promise.race([
        fetch('https://fileconverter.intranet.provincia.lucca/convert', {
          method: 'POST',
          body: formData,
          timeout: 300000, // Timeout di 5 minuti
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout scaduto')), 300000)),
      ]);

      if (response.ok) {
        const resultFileName = file.name.replace(/\.[^.]+$/, `.${selectedFormat}`);
        const resultBlob = await response.blob();

        toggleLoadingMessage(false); // Nascondi il messaggio di caricamento

        const url = window.URL.createObjectURL(resultBlob);
        const a = document.getElementById('downloadLink');
        a.href = url;
        a.download = resultFileName;
        a.style.display = 'block';
      } else {
        console.error('Errore nella richiesta:', response.statusText);
        alert('Errore durante l\'elaborazione del file.');
      }
    } catch (error) {
      console.error('Errore generale:', error);

      if (error instanceof DOMException && error.name === 'AbortError') {
        alert('La richiesta è stata annullata.');
      } else if (error.message === 'Timeout scaduto') {
        alert('Timeout scaduto. Riprova con un file più piccolo o verifica la connessione.');
      } else {
        alert('Si è verificato un errore durante l\'elaborazione del file.');
      }
    } finally {
      toggleLoadingMessage(false);
    }
  } else {
    alert('Seleziona un file prima di procedere.');
  }
});
