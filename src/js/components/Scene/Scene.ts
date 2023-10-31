class Scene {
  private objects: Object[] = [];
  private computeObjects: Object[] = [];

  public add(object: Object) {
    this.objects.push(object);
  }

  public addCompute(object: Object) {
    this.computeObjects.push(object);
  }

  public getObjects(): Object[] {
    return this.objects;
  }
  public getComputeObjects(): Object[] {
    return this.computeObjects;
  }
}

export { Scene };
