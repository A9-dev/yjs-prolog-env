import PrologBuilder from "../PrologBuilder";

class PrologService {
  private builder: PrologBuilder;

  constructor(builder: PrologBuilder) {
    this.builder = builder;
  }

  public async addRule(rule: string) {
    await this.builder.addRule(rule);
  }

  public async query(query: string) {
    return await this.builder.querySwiplEngine(query);
  }
}

export default PrologService;
