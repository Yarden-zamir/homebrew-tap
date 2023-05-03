# typed: false
# frozen_string_literal: true

class ZshActCompletion < Formula
  desc "Zsh completions for act (for github)"
  homepage "https://github.com/Yarden-zamir/zsh-act-completion"
  url "https://github.com/Yarden-zamir/zsh-act-completion/archive/v0.0.20.tar.gz"
  sha256 "d21be4f34f44d33063fcc2e0d6393e1acddbd4afdc9678021710e0a8b7d4b415"
  license "MIT"

  def install
    zsh_completion.install "zsh/_act" => "_act"
  end
end
