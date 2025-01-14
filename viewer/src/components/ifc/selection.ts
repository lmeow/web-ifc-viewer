import { Intersection, Material, Mesh, Scene } from 'three';
import { IfcMesh } from 'web-ifc-three/IFC/BaseDefinitions';
import { IFCLoader } from 'web-ifc-three/IFCLoader';
import { IfcComponent, Context } from '../../base-types';

export class IfcSelection extends IfcComponent {
  mesh: Mesh | null = null;
  private selected: number;
  private modelID: number;
  private readonly material: Material | undefined;
  private loader: IFCLoader;
  private readonly scene: Scene;

  constructor(private context: Context, loader: IFCLoader, material?: Material) {
    super(context);
    this.scene = context.getScene();
    this.loader = loader;
    this.material = material;
    this.selected = -1;
    this.modelID = -1;
  }

  pick = async (item: Intersection, focusSelection = false) => {
    if (this.selected === item.faceIndex || item.faceIndex == null) return null;
    this.selected = item.faceIndex;
    const mesh = item.object as IfcMesh;
    const id = await this.loader.ifcManager.getExpressId(mesh.geometry, item.faceIndex);
    if (id === undefined) return null;
    this.removeSelectionOfOtherModel(mesh);
    this.modelID = mesh.modelID;
    this.newSelection([id]);
    if (focusSelection) this.focusSelection();
    return { modelID: this.modelID, id };
  };

  unpick() {
    this.mesh = null;
    this.loader.ifcManager.removeSubset(this.modelID, this.scene, this.material);
  }

  pickByID = (modelID: number, ids: number[], focusSelection = false) => {
    this.modelID = modelID;
    this.newSelection(ids);
    if (focusSelection) this.focusSelection();
  };

  newSelection = (ids: number[]) => {
    const mesh = this.loader.ifcManager.createSubset({
      scene: this.scene,
      modelID: this.modelID,
      ids,
      removePrevious: true,
      material: this.material
    });
    if (mesh) {
      this.mesh = mesh;
    }
  };

  removeSelectionOfOtherModel(mesh?: IfcMesh) {
    if (this.modelID !== undefined && this.modelID !== mesh?.modelID) {
      this.loader.ifcManager.removeSubset(this.modelID, this.scene, this.material);
    }
  }

  private focusSelection() {
    if (this.mesh) {
      this.context.ifcCamera.targetItem(this.mesh);
    }
  }
}
