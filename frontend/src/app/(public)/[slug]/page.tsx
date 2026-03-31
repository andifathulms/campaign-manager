interface Props {
  params: { slug: string };
}

export default function CampaignPage({ params }: Props) {
  return (
    <div>
      <h1>Campaign: {params.slug}</h1>
      {/* Will be implemented in Step 4 */}
    </div>
  );
}
