# msgconvert

A dockerized webservice to convert Microsoft Outlook .msg files to .eml
(message/rfc822) format and .pdf to .docx format

## Description

fileconverter uses the Perl module Email::Outlook::Message for .eml conversion and pdf2docx for .pdf conversion.
It exposes just a single endpoint for uploading an .msg or .pdf file and returns the
converted .eml or .docx. 

The webservice is written in Python using the aiohttp web server.

## Usage

To start the webservice just run
```
docker build -t fileconverter:latest .
docker run -p 8080:8080 fileconverter:latest
```

The .msg or .pdf file must be uploaded as multipart/form-data with a part named `file`
containing the .msg or .pdf file.

Example:

```
curl -F "file=@tests/sample.msg" http://localhost:8080/
```
