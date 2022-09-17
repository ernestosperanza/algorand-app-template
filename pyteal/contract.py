from pyteal import *

is_creator = Txn.sender() == Global.creator_address()
router = Router(
    # Name of the contract
    "template-contract",
    # What to do for each on-complete type when no arguments are passed (bare call)
    BareCallActions(
        no_op=OnCompleteAction.create_only(Approve()),
        update_application=OnCompleteAction.always(Return(is_creator)),
        delete_application=OnCompleteAction.always(Return(is_creator)),
        clear_state=OnCompleteAction.never(),
    )
)

if __name__ == "__main__":
    import os
    import json

    path = os.path.dirname(os.path.abspath(__file__))

    approval, clear, contract = router.compile_program(
        version=6, optimize=OptimizeOptions(scratch_slots=True)
    )

    # Dump out the contract as json that can be read in by any of the SDKs
    with open(os.path.join(path, "../contracts/contract.json"), "w") as f:
        f.write(json.dumps(contract.dictify(), indent=2))

    # Write out the approval and clear programs
    with open(os.path.join(path, "../contracts/approval.teal"), "w") as f:
        f.write(approval)

    with open(os.path.join(path, "../contracts/clear.teal"), "w") as f:
        f.write(clear)