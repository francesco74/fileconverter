FROM python:3.9-slim

COPY requirements.txt /
RUN pip install --upgrade pip
RUN pip3 install -r /requirements.txt

RUN apt-get update 
RUN apt-get install libemail-outlook-message-perl -y
RUN apt-get install libgl1 -y
RUN apt-get install libglib2.0-0 -y
RUN apt-get install pandoc pandoc-data -y
RUN apt-get install cpanminus -y
RUN cpanm App::winmaildat2tar

EXPOSE 8080

COPY converter.py  .
COPY index.html .
COPY static ./static/

CMD ["python3", "converter.py"]

