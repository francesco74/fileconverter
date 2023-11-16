function displayFileName() {
    var input = document.getElementById('fileInput');
    var fileNameDisplay = document.getElementById('fileName');
    var uploadButton = document.getElementById('uploadButton');
      
    if (input.files.length > 0) {
      fileNameDisplay.innerHTML = 'File selezionato: ' + input.files[0].name;
      uploadButton.disabled = false; // Abilita il pulsante quando un file è selezionato
    } else {
      fileNameDisplay.innerHTML = '';
      uploadButton.disabled = true; // Disabilita il pulsante quando nessun file è selezionato
    }
  }
  
  function uploadFile() {
    var input = document.getElementById('fileInput');
    var file = input.files[0];
  
    if (file) {
      var formData = new FormData();
      formData.append('file', file);
  
      // Mostra il messaggio di caricamento
      document.getElementById('loadingMessage').style.display = 'block';
  
      fetch('http://fileconverter.intranet.provincia.lucca:8080/convert', {
        method: 'POST',
        body: formData
      })
      .then(response => response.blob())
      .then(blob => {
        // Nascondi il messaggio di caricamento
        document.getElementById('loadingMessage').style.display = 'none';
  
        var url = window.URL.createObjectURL(blob);
        var a = document.getElementById('downloadLink');
        a.href = url;
        a.download = 'risultato.eml';
        a.style.display = 'block';
  
        //var resultElement = document.getElementById('result');
        //resultElement.innerHTML = 'Risultato: <a href="' + url + '" download>Scarica risultato</a>';
      })
      .catch(error => {
        console.error('Errore durante la richiesta:', error);
        // Nascondi il messaggio di caricamento in caso di errore
        document.getElementById('loadingMessage').style.display = 'none';
      });
    } else {
      alert('Seleziona un file prima di procedere.');
    }
  }
  