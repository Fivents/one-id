import { IPersonFaceRepository } from '@/core/domain/contracts';

export class ActivateFaceUseCase {
  constructor(private readonly personFaceRepository: IPersonFaceRepository) {}

  async execute(personId: string, faceId: string): Promise<void> {
    const faces = await this.personFaceRepository.findActiveByPerson(personId);

    // Deactivate all current active faces
    for (const face of faces) {
      if (face.id !== faceId) {
        await this.personFaceRepository.deactivate(face.id);
      }
    }

    // Note: activation is handled by creating a new face or re-creating
    // The active state is set at creation time
  }
}
