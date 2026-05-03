export function RationaleBody() {
  return (
    <div lang="en" className="max-w-[100ch] mx-auto">
      <p >
      <span className="block leading-6 [text-indent:1.6rem]">
        The alignment of gender equality and climate action is now a strategic imperative in
        development finance. Yet, despite elevated attention in donor strategies, integration
        across these priorities remains limited and inconsistent. Available evidence indicates
        that data systems typically record gender and climate objectives separately, constraining
        transparency at the intersection and limiting comparability.
      </span>
      <br></br>
      </p>
      <p >
      <span className="block leading-6 [text-indent:1.6rem]">
        OECD analysis shows that while climate-related ODA with gender equality objectives has grown
        substantially—from ~USD 5.9 billion (2011–12) to ~USD 22 billion (2019–20)—the
        portion addressing the full gender-climate-biodiversity intersection remained only
        ~USD 3.9 billion over the same period,
        {" "}
        <a style={{ color:"var(--semantic-integrated)" }}
          href="https://www.oecd.org/content/dam/oecd/en/publications/reports/2023/10/the-gender-equality-and-environment-intersection_cb021281/c16d8fe8-en.pdf"
          target="_blank" rel="noopener noreferrer"
        >
          (OECD (2023), <em>The Gender Equality and Environment Intersection)</em>
        </a>.
        The report also notes that, although more than half of climate-related ODA now integrates
        gender objectives, strategic frameworks and measurement practices remain uneven—limiting both
        transparency and comparability.
      </span>
      <br></br>
      </p>

      <p >
      <span className="block leading-6 [text-indent:1.6rem]">
        Broader measurement gaps further compound this challenge. For example,
        {" "}
        <a style={{ color:"var(--semantic-integrated)" }}
          href="https://data2x.org/wp-content/uploads/2023/10/Data-Gaps-in-Environment-and-Climate-Change-WR-251023.pdf"
          target="_blank" rel="noopener noreferrer"
        >
          (Data2X (2023), <em>Data Gaps in Environment and Climate Change)</em>
        </a>{" "}
        highlights persistent deficiencies in internationally comparable, gender-disaggregated
        environmental metrics, impeding rigorous tracking of intersectional outcomes. These trends present both risk and opportunity. The risk is continued allocation via parallel “gender-only” or “climate-only” streams, leaving synergy and efficiency gains unrealized. The opportunity is portfolio integration: systematically co-investing across gender and climate to enhance resilience, equity, and development impact.
      </span>
      <br></br>
      </p>

      <p >
        <span className="block leading-6 [text-indent:1.6rem]">
          Through this platform, we aim to deliver rigorous analytics on the <strong style={{ color:"var(--semantic-climateOnly)" }}>gender and climate intersection</strong> of ODA flows,
          moving beyond surface-level marker counts and exposing where integrated funding
          exists, where it is lacking, and how collaboration can be amplified.
        EcoEquity supports <strong style={{ color:"var(--semantic-climateOnly)" }}>SDG 5</strong> 
        (Gender Equality), 
        <strong style={{ color:"var(--semantic-climateOnly)" }}>SDG 13</strong> (Climate Action),
        and <strong style={{ color:"var(--semantic-climateOnly)" }}>SDG 17</strong> (Partnerships for the Goals), and aligns with the
        {" "}
        <a style={{ color:"var(--semantic-integrated)" }}
          href="https://www.undp.org/publications/undp-strategic-plan-2022-2025"
          target="_blank" rel="noopener noreferrer"
        >
          UNDP Strategic Plan 2022–2025
        </a>{" "}
        emphasis on integrated, evidence-driven development financing, as well as the
        {" "}
        <a style={{ color:"var(--semantic-integrated)" }}
          href="https://unfccc.int/gender"
          target="_blank" rel="noopener noreferrer"
        >
          UNFCCC Gender Action Plan
        </a>.
        From a governance and investment perspective, the platform equips executive leadership—ministries,
        multilaterals, and philanthropic consortia—to pivot from retrospective reporting to forward-looking
        strategies: identifying untapped intersectional opportunities, enhancing resource efficiency, and aligning
        portfolios around equity and climate resilience.
      </span>
      </p>

      <br></br>
      <h4>Additional Source for Core Data</h4>
      <p className="text-xs text-muted-foreground">
        OECD Creditor Reporting System (CRS), 2013–2023. EcoEquity provides a tagged slice for the gender × climate
        view; marker definitions and methodology are documented in the project repository.
      </p>
    </div>
  );
}
