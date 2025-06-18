import PrologEnvironment from "../PrologBuilder";

class PrologQueryService {
  private builder: PrologEnvironment;

  constructor(builder: PrologEnvironment) {
    this.builder = builder;
  }

  public async query(query: string) {
    return await this.builder.querySwiplEngine(query);
  }
}

export default PrologQueryService;
