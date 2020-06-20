import * as moment from "moment";
import axios from "axios";

export interface ApiRow {
  time: string;
  temp?: number;
  co2?: number;
}

const time_format = "YYYY-MM-DD HH:mm:ss";

export async function get_data(
  begin: moment.Moment,
  end: moment.Moment
): Promise<ApiRow[]> {
  const temp_req = axios.get<ApiRow[]>(
    "https://fuwa.dev/roomtemp_api/get_temp.php",
    {
      params: {
        begin: begin.format(time_format),
        end: end.format(time_format),
      },
    }
  );

  const co2_req = axios.get<ApiRow[]>(
    "https://fuwa.dev/roomtemp_api/get_co2.php",
    {
      params: {
        begin: begin.format(time_format),
        end: end.format(time_format),
      },
    }
  );

  // eslint-disable-next-line prefer-const
  let ret: ApiRow[] = [];

  ret = ret.concat((await temp_req).data);
  ret = ret.concat((await co2_req).data);

  return ret;
}
