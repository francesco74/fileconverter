FROM python:3.9-slim

COPY requirements.txt /
RUN pip3 install -r /requirements.txt

RUN apt-get update 
RUN apt-get install libgl1 -y
RUN apt-get install libglib2.0-0 -y

EXPOSE 8080

COPY converter.py  .
COPY index.html .
COPY static ./static/

CMD ["python3", "converter.py"]

