import WidgetStudio from "../../../WidgetStudio";

export default async function ToolPage({ params }) {
  const { id } = await params;
  return <WidgetStudio initialWidget={id} />;
}
