# typed: false
# frozen_string_literal: true

class ZshActCompletion < Formula
  desc "Zsh completions for act (for github)"
  homepage "https://github.com/Yarden-zamir/zsh-act-completion"
  url "https://github.com/Yarden-zamir/zsh-act-completion/archive/v0.0.30.tar.gz"
  sha256 "6cdba84a58784748c32b78f5194b2ef3e124974d182c02c2c00fbc40c9744e53"
  license "MIT"

  def install
    zsh_completion.install "zsh/_act" => "_act"
  end
end
