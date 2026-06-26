import torch.optim as optim

def get_scheduler(optimizer, scheduler_type="ReduceLROnPlateau", **kwargs):
    """
    Scheduler factory that constructs schedulers based on type.
    """
    if scheduler_type == "ReduceLROnPlateau":
        mode = kwargs.get("mode", "max")
        factor = kwargs.get("factor", 0.5)
        patience = kwargs.get("patience", 3)
        return optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode=mode, factor=factor, patience=patience)
    elif scheduler_type == "CosineAnnealingLR":
        T_max = kwargs.get("T_max", 10)
        eta_min = kwargs.get("eta_min", 0)
        return optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=T_max, eta_min=eta_min)
    elif scheduler_type == "StepLR":
        step_size = kwargs.get("step_size", 5)
        gamma = kwargs.get("gamma", 0.1)
        return optim.lr_scheduler.StepLR(optimizer, step_size=step_size, gamma=gamma)
    else:
        return None
