import os
import requests
import pandas as p
from utils import sanitize_filename, drop_excel_letter_ranges  # same names, same behavior
from pricechart.config import SETTINGS

API_BASE = "https://www.pricecharting.com/price-guide/download-custom?t=823553b0078080e630aaba81011b96ff4bba6ba6&console-uids="
SAVE_DIR = SETTINGS["data_path"]
EXCEL_FILE = SETTINGS["uids_excel"]
DELETE_CSV_AFTER = True
REQUEST_TIMEOUT = 60


def main():
    os.makedirs(SAVE_DIR, exist_ok=True)
    df_list = pd.read_excel(EXCEL_FILE, header=0)
    df_list = df_list.dropna(how="all")
    for _, row in df_list.iterrows():
        console_name = sanitize_filename(str(row.iloc[0]))
        uid = str(row.iloc[1]).strip()
        if not console_name or not uid or uid.lower() == "nan":
            print(f"⚠️ Skipping row with missing console/uid: {row.to_dict()}")
            continue
        url = API_BASE + uid
        csv_path = os.path.join(SAVE_DIR, f"{console_name}.csv")
        xlsx_path = os.path.join(SAVE_DIR, f"{console_name}.xlsx")
        try:
            resp = requests.get(
                url,
                timeout=REQUEST_TIMEOUT,
                headers={"User-Agent": "Mozilla/5.0 (PriceChartingDownloader/1.0)"}
            )
            resp.raise_for_status()
            with open(csv_path, "wb") as f:
                f.write(resp.content)
            print(f"✅ Downloaded & replaced {os.path.basename(csv_path)}")
            df_csv = pd.read_csv(csv_path, low_memory=False)
            df_clean = drop_excel_letter_ranges(df_csv)
            df_clean.to_excel(xlsx_path, index=False)
            print(f"📂 Converted & cleaned → {os.path.basename(xlsx_path)}")
            if DELETE_CSV_AFTER:
                try:
                    os.remove(csv_path)
                except Exception as e:
                    print(f"⚠️ Couldn't delete CSV ({csv_path}): {e}")
        except requests.exceptions.RequestException as e:
            print(f"❌ Network/HTTP error for {console_name}: {e}")
        except Exception as e:
            print(f"❌ Processing error for {console_name}: {e}")

if __name__ == "__main__":
    main()
