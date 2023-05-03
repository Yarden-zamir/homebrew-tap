# typed: false
# frozen_string_literal: true

class ZshActCompletion < Formula
  desc "Zsh completions for act (for github)"
  homepage "https://github.com/Yarden-zamir/zsh-act-completion"
  url "https://github.com/Yarden-zamir/zsh-act-completion/archive/v0.0.19.tar.gz"
  sha256 "410090b40778f681d1d0f7767e5d8be83fd3f47f50cbc021757486bf958bce12"
  license "MIT"

  def install
    zsh_completion.install "_act"
  end
end
