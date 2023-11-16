import mimetypes
from aiohttp import web, FormData, ClientSession
from aiohttp.web import middleware
import tempfile
import os.path
import subprocess
import logging
from pdf2docx import Converter

CHUNK_SIZE = 65536

logger = logging.getLogger()

@middleware
async def cors_middleware(request, handler):
    response = await handler(request)
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'POST, GET, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    response.headers['Access-Control-Allow-Credentials'] = 'true'
    return response

async def index(request):
    with open("index.html", "r") as file:
        content = file.read()
    return web.Response(body=content, content_type="text/html")

async def static_handler(request):
    filename = request.match_info.get('filename')
    file_path = os.path.join('static', filename)

    if os.path.exists(file_path):
        with open(file_path, 'rb') as file:
            content = file.read()

        mime_type, _ = mimetypes.guess_type(file_path)
        response = web.Response(body=content, content_type=mime_type)
        return response
    else:
        return web.Response(status=404, text=f"File not found: {filename}")

async def converter(request):
    form_data = {}
    temp_dir = None

    if not request.content_type == 'multipart/form-data':
        logger.info(
            'Bad request. Received content type %s instead of multipart/form-data.',
            request.content_type,
        )
        return web.Response(status=400, text="Multipart request required.")

    reader = await request.multipart()

    with tempfile.TemporaryDirectory() as temp_dir:
        while True:
            part = await reader.next()

            if part is None:
                break

            if part.name == 'file':
                logger.debug('Adding data to form_data')
                form_data['file'] = await save_part_to_file(part, temp_dir)
            else:
                logger.error('Parameter name  %s', part.name)

        if 'file' in form_data:
            logger.debug('Converting %s file', form_data['file'])

            filename, file_extension = os.path.splitext(form_data['file'])
            logger.debug('filename base %s', filename)
            logger.debug('filename extension %s', file_extension)

            if file_extension == '.msg':
                logger.debug('Converting MSG file')

                outfilename = os.path.join(
                    temp_dir, filename + '.eml')
                res = subprocess.run(
                    ['msgconvert', '--outfile', outfilename, form_data['file']],
                    capture_output=True,
                    text=True,
                )

                if res.returncode == 0:
                    with open(outfilename, 'rb') as outfile:
                        content = outfile.read()

                    response = web.StreamResponse(
                        status=200,
                        reason='OK',
                        headers={
                            'Content-Type': 'message/rfc822',
                            'Access-Control-Allow-Origin': '*',
                        },
                    )
                    await response.prepare(request)

                    await response.write(content)
                    await response.write_eof()
                    return response
                else:
                    logger.error('Conversion failed. %s', res.stderr)
                    return web.Response(
                        status=500, text=f"Conversion failed. {res.stderr}")
            elif file_extension == '.pdf':
                logger.debug('Converting PDF file')

                outfilename = os.path.join(
                    temp_dir, filename + '.docx')
                cv = Converter(form_data['file'])
                cv.convert(outfilename)      # all pages by default
                cv.close()

                with open(outfilename, 'rb') as outfile:
                    content = outfile.read()

                response = web.StreamResponse(
                    status=200,
                    reason='OK',
                    headers={
                        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                        'Access-Control-Allow-Origin': '*',
                    },
                )
                await response.prepare(request)

                await response.write(content)
                await response.write_eof()
                return response
                
            logger.debug('Unknown extension.')
        else:
            logger.debug('No file in form_data.')

    logger.info('Bad request. No file provided.')
    return web.Response(status=400, text="No file provided.")


async def save_part_to_file(part, directory):
    filename = os.path.join(directory, part.filename)
    with open(os.path.join(directory, filename), 'wb') as file_:
        while True:
            chunk = await part.read_chunk(CHUNK_SIZE)
            if not chunk:
                break
            file_.write(chunk)
    return filename

async def healthcheck(request):
    return web.Response(status=200, text="OK")

if __name__ == '__main__':
    logging.basicConfig(
        format='%(asctime)s %(levelname)s %(name)s %(message)s',
        level=logging.DEBUG,
    )

    logging.getLogger().setLevel(logging.DEBUG)

    app = web.Application(middlewares=[cors_middleware])
    app.router.add_route('GET', '/', index)
    app.router.add_route('GET', '/static/{filename}', static_handler)
    app.router.add_route('POST', '/convert', converter)
    app.router.add_route('GET', '/healthcheck', healthcheck)

    web.run_app(app, host='0.0.0.0', port=8080)
