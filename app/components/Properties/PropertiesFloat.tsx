import { JSONFloatType } from "@jsonhero/json-infer-types";
import { formatValue } from "~/utilities/formatter";
import { DataTable } from "../DataTable";
import { ValueIcon } from "../ValueIcon";

export type PropertiesFloatProps = {
  type: JSONFloatType;
};

export function PropertiesFloat(info: PropertiesFloatProps) {
  return (
    <DataTable
      rows={[
        {
          key: "格式化值",
          value: formatValue(info.type) ?? "",
          icon: <ValueIcon type={info.type} />,
        },
        {
          key: "类型",
          value: info.type.name,
        },
      ]}
    />
  );
}