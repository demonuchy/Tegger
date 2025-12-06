import docxtpl
from docx import Document
import os

TEMPLATE_FILE = "template.docx"  
OUTPUT_DIR = "done_application"

print(os.getcwd())


if not os.path.exists(OUTPUT_DIR):
    os.makedirs(OUTPUT_DIR)


class ApplicationDocxMapper:
    def __init__(self, template_file_name):
        self.template = template_file_name
        self.core = docxtpl.DocxTemplate(template_file_name)

    def get_paragraf(self):
        doc = Document(self.template)
        for i, paragraph in enumerate(doc.paragraphs, 1):
            print(f"Абзац {i}: {paragraph.text}")
        

    def create_application_doc(self, data : dict):
        self.core.render(data)
        file_name  = os.path.join(OUTPUT_DIR, f"{''.join(data.get('full_name').split(' '))}.docx")
        self.core.save(file_name)


ApplicationDocxMapper(TEMPLATE_FILE).create_application_doc({"full_name": "Бесс Дима Крутой"})

# create_application_doc({"full_name": "Бесс Дима Крутой"})


