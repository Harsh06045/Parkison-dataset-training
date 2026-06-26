import torch
import torch.nn as nn

class TelemonitorMLPRegressor(nn.Module):
    """
    Multi-Layer Perceptron for UPDRS severity regression.
    """
    def __init__(self, input_dim=19, hidden_dim=64, output_dim=2, dropout=0.2):
        super(TelemonitorMLPRegressor, self).__init__()
        self.net = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.BatchNorm1d(hidden_dim),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_dim, hidden_dim // 2),
            nn.BatchNorm1d(hidden_dim // 2),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_dim // 2, output_dim)
        )
        
    def forward(self, x):
        return self.net(x)
