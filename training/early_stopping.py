class EarlyStopping:
    """
    Early stopping helper to terminate training when a monitored validation metric ceases to improve.
    """
    def __init__(self, patience=10, mode="max", min_delta=0.0):
        self.patience = patience
        self.mode = mode
        self.min_delta = min_delta
        self.counter = 0
        self.best_score = None
        self.early_stop = False
        
        assert mode in ["min", "max"], "mode must be either 'min' or 'max'"

    def step(self, current_score):
        if self.best_score is None:
            self.best_score = current_score
            return True
            
        if self.mode == "max":
            if current_score >= self.best_score + self.min_delta:
                self.best_score = current_score
                self.counter = 0
                return True
            else:
                self.counter += 1
                if self.counter >= self.patience:
                    self.early_stop = True
                return False
        else: # mode == "min"
            if current_score <= self.best_score - self.min_delta:
                self.best_score = current_score
                self.counter = 0
                return True
            else:
                self.counter += 1
                if self.counter >= self.patience:
                    self.early_stop = True
                return False
