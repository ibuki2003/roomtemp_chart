import * as moment from "moment";
import axios from "axios";

export interface ApiRow {
  time: string;
  temp: number;
}

const time_format = "YYYY-MM-DD HH:mm:ss";

export async function get_data(
  begin: moment.Moment,
  end: moment.Moment
): Promise<ApiRow[]> {
  return (
    await axios.get<ApiRow[]>("https://fuwa.dev/roomtemp_api/get.php", {
      params: {
        begin: begin.format(time_format),
        end: end.format(time_format),
      },
    })
  ).data;
}
