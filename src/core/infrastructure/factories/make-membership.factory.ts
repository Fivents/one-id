import { containerService } from '@/core/application/services';
import { AddMemberUseCase } from '@/core/application/use-cases/membership/add-member.use-case';
import { GetMemberUseCase } from '@/core/application/use-cases/membership/get-member.use-case';
import { ListMembersUseCase } from '@/core/application/use-cases/membership/list-members.use-case';
import { RemoveMemberUseCase } from '@/core/application/use-cases/membership/remove-member.use-case';
import { UpdateMemberRoleUseCase } from '@/core/application/use-cases/membership/update-member-role.use-case';

export function makeAddMemberUseCase(): AddMemberUseCase {
  return new AddMemberUseCase(containerService.getMembershipRepository());
}

export function makeRemoveMemberUseCase(): RemoveMemberUseCase {
  return new RemoveMemberUseCase(containerService.getMembershipRepository());
}

export function makeUpdateMemberRoleUseCase(): UpdateMemberRoleUseCase {
  return new UpdateMemberRoleUseCase(containerService.getMembershipRepository());
}

export function makeListMembersUseCase(): ListMembersUseCase {
  return new ListMembersUseCase(containerService.getMembershipRepository());
}

export function makeGetMemberUseCase(): GetMemberUseCase {
  return new GetMemberUseCase(containerService.getMembershipRepository());
}
