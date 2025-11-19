import pandas as pd 
import io

def convert_to_excel(colums_name : list, data : list[list]):
    df = pd.DataFrame(data, columns=colums_name)  
    with pd.ExcelWriter('output.xlsx') as writer:  
        df.to_excel(writer, sheet_name='Участники', index=False)


def convert_to_excel_buffer(colums_name: list, data: list[list]) -> io.BytesIO:
    """Создает Excel файл в памяти и возвращает BytesIO объект"""
    df = pd.DataFrame(data, columns=colums_name)
    buffer = io.BytesIO()
    with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
        df.to_excel(writer, sheet_name='Участники', index=False)
    buffer.seek(0)
    return buffer