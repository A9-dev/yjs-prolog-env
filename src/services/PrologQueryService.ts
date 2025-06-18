import PrologEnvironment from "../PrologEnvironment";

class PrologQueryService {
  private prologEnvironment: PrologEnvironment;

  constructor(builder: PrologEnvironment) {
    this.prologEnvironment = builder;
  }

  public async query(query: string) {
    return await this.prologEnvironment.querySwiplEngine(query);
  }
}

export default PrologQueryService;
